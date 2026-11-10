"""Exact developer tree snapshots with shared content objects and original directory metadata.

This preserves bytes/modes/nanosecond timestamps, not inode identities or a transaction lock.
Originals are never removed by this codec. Every published destination is single-use.
"""
from pathlib import Path, PurePosixPath
import argparse, hashlib, json, os, re, shutil, stat, tempfile, zipfile

FORMAT = 'wod-content-tree-evidence'
INDEX = 'TREE_INDEX.json'
MAX_FILES = 50000
MAX_BYTES = 4 * 1024**3


def sha(path):
    with Path(path).open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def relative(value, directory=False):
    if not isinstance(value, str) or '\\' in value or '\0' in value:
        raise ValueError('Invalid relative tree path')
    path = PurePosixPath(value)
    if (value == '.' and directory):
        return value
    if not path.parts or path.is_absolute() or '..' in path.parts or path.as_posix() != value or value == '.':
        raise ValueError('Unsafe relative tree path')
    return value


def attrs(path):
    value = Path(path).lstat()
    if stat.S_ISLNK(value.st_mode) or not (stat.S_ISREG(value.st_mode) or stat.S_ISDIR(value.st_mode)):
        raise ValueError('Only real regular files and directories are supported')
    mode = stat.S_IMODE(value.st_mode)
    if mode & ~0o777:
        raise ValueError('Special permission bits are not supported')
    return dict(mode=mode, mtimeNs=value.st_mtime_ns)


def inventory(root):
    root = Path(root).absolute()
    if root != root.resolve() or not root.is_dir():
        raise ValueError('Explicit real source directory required')
    files, directories = [], []
    for path in [root, *sorted(root.rglob('*'))]:
        value = attrs(path)
        name = '.' if path == root else path.relative_to(root).as_posix()
        if path.is_dir():
            directories.append(dict(relative=name, **value))
        else:
            files.append(dict(relative=name, bytes=path.stat().st_size, sha256=sha(path), **value))
    if not files or len(files) > MAX_FILES or sum(row['bytes'] for row in files) > MAX_BYTES:
        raise ValueError('Tree size is outside supported bounds')
    return dict(original=str(root), files=files, directories=directories)


def fsyncdir(path):
    fd = os.open(path, os.O_RDONLY | os.O_DIRECTORY)
    try:
        os.fsync(fd)
    finally:
        os.close(fd)


def fresh(path):
    path = Path(path).absolute()
    if path != path.resolve() or not path.parent.is_dir():
        raise ValueError('Explicit real destination parent required')
    if path.exists() or path.is_symlink():
        raise FileExistsError('Existing destination is preserved')
    return path


def inspect(archive, expected_sha=None):
    archive = Path(archive)
    if archive.is_symlink() or not archive.is_file():
        raise ValueError('Regular archive required')
    if expected_sha is not None and sha(archive) != expected_sha:
        raise ValueError('Archive SHA256 differs')
    with zipfile.ZipFile(archive) as source:
        names = source.namelist()
        if len(names) != len(set(names)) or INDEX not in names or source.getinfo(INDEX).file_size > 32 * 1024**2:
            raise ValueError('Duplicate, missing or oversized tree index')
        result = json.loads(source.read(INDEX))
        if result.get('format') != FORMAT or result.get('version') != 1 or not isinstance(result.get('roots'), dict) or not result['roots']:
            raise ValueError('Unsupported tree format')
        objects, count, total = {}, 0, 0
        original_roots = []
        for label, tree in result['roots'].items():
            if not re.fullmatch('[a-z0-9_-]{1,48}', label) or not isinstance(tree.get('original'), str) or not Path(tree['original']).is_absolute():
                raise ValueError('Invalid tree identity')
            original = Path(tree['original'])
            if '..' in original.parts or original.as_posix() != tree['original']:
                raise ValueError('Noncanonical original root')
            if any(original == other or original.is_relative_to(other) or other.is_relative_to(original) for other in original_roots):
                raise ValueError('Source roots overlap')
            original_roots.append(original)
            seen_files, seen_dirs = set(), set()
            for directory, rows in [(False, tree['files']), (True, tree['directories'])]:
                for row in rows:
                    name = relative(row['relative'], directory)
                    seen = seen_dirs if directory else seen_files
                    if name in seen or type(row['mode']) is not int or not 0 <= row['mode'] <= 0o777 or type(row['mtimeNs']) is not int or row['mtimeNs'] < 0:
                        raise ValueError('Invalid or duplicate tree metadata')
                    seen.add(name)
                    if not directory:
                        if type(row['bytes']) is not int or not 0 <= row['bytes'] <= MAX_BYTES or not re.fullmatch('[a-f0-9]{64}', row['sha256']):
                            raise ValueError('Invalid content binding')
                        digest = row['sha256']
                        if digest in objects and objects[digest] != row['bytes']:
                            raise ValueError('Conflicting object size')
                        objects[digest] = row['bytes']
                        count += 1
                        total += row['bytes']
            if '.' not in seen_dirs or seen_files & seen_dirs or any(PurePosixPath(name).parent.as_posix() not in seen_dirs for name in seen_files | (seen_dirs - {'.'})):
                raise ValueError('Incomplete or conflicting directory set')
        if not 0 < count <= MAX_FILES or total > MAX_BYTES or set(names) != {INDEX, *('objects/' + digest for digest in objects)}:
            raise ValueError('Incomplete or unexpected archive members')
        for digest, length in objects.items():
            name = 'objects/' + digest
            info = source.getinfo(name)
            if info.file_size != length or stat.S_IFMT(info.external_attr >> 16) != stat.S_IFREG or info.flag_bits & 1:
                raise ValueError('Object size differs')
            with source.open(name) as stream:
                if hashlib.file_digest(stream, 'sha256').hexdigest() != digest:
                    raise ValueError('Object digest differs')
    return result


def pack(roots, destination):
    destination = fresh(destination)
    if any(destination.is_relative_to(Path(root).absolute()) for root in roots.values()):
        raise ValueError('Archive must be outside source trees')
    index = dict(format=FORMAT, version=1, roots={label: inventory(root) for label, root in roots.items()})
    with tempfile.TemporaryDirectory(prefix='wod-tree-candidate-', dir=destination.parent) as temporary:
        candidate = Path(temporary) / 'archive.zip'
        written = set()
        with zipfile.ZipFile(candidate, 'x', zipfile.ZIP_DEFLATED, compresslevel=3) as archive:
            for tree in index['roots'].values():
                for row in tree['files']:
                    if row['sha256'] in written:
                        continue
                    info = zipfile.ZipInfo('objects/' + row['sha256'], date_time=(2000, 1, 1, 0, 0, 0))
                    info.create_system = 3
                    info.external_attr = 0o100600 << 16
                    info.compress_type = zipfile.ZIP_DEFLATED
                    with (Path(tree['original']) / row['relative']).open('rb') as source, archive.open(info, 'w') as target:
                        shutil.copyfileobj(source, target)
                    written.add(row['sha256'])
            archive.writestr(INDEX, json.dumps(index, ensure_ascii=False, separators=(',', ':')).encode())
        inspect(candidate)
        for label, tree in index['roots'].items():
            if inventory(tree['original']) != tree:
                raise ValueError('Source changed during capture; originals remain')
        with candidate.open('rb') as stream:
            os.fsync(stream.fileno())
        os.link(candidate, destination)
        fsyncdir(destination.parent)
    return dict(passed=True, archive=str(destination), bytes=destination.stat().st_size, sha256=sha(destination), roots=list(index['roots']), files=sum(len(tree['files']) for tree in index['roots'].values()), uniqueObjects=len(written), logicalBytes=sum(row['bytes'] for tree in index['roots'].values() for row in tree['files']), sourceRemoved=False)


def restore(archive, label, destination, expected_sha):
    destination = fresh(destination)
    index = inspect(archive, expected_sha)
    tree = index['roots'][label]
    destination.mkdir(mode=0o700)
    for row in sorted(tree['directories'], key=lambda row: len(PurePosixPath(row['relative']).parts)):
        (destination / row['relative']).mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(archive) as source:
        for row in tree['files']:
            path = destination / row['relative']
            with source.open('objects/' + row['sha256']) as stream, path.open('xb') as target:
                shutil.copyfileobj(stream, target)
                target.flush()
                os.fsync(target.fileno())
            if path.stat().st_size != row['bytes'] or sha(path) != row['sha256']:
                raise ValueError('Restored content differs')
            path.chmod(row['mode'])
            os.utime(path, ns=(row['mtimeNs'], row['mtimeNs']))
    for row in sorted(tree['directories'], key=lambda row: len(PurePosixPath(row['relative']).parts), reverse=True):
        path = destination / row['relative']
        path.chmod(row['mode'])
        os.utime(path, ns=(row['mtimeNs'], row['mtimeNs']))
    restored = inventory(destination)
    if restored['files'] != tree['files'] or restored['directories'] != tree['directories']:
        raise ValueError('Whole restored namespace differs')
    return dict(passed=True, label=label, files=len(tree['files']), directories=len(tree['directories']), allBytesModesNsExact=True, originalSourceNotRead=True)


def bindings(archive, expected_sha):
    index = inspect(archive, expected_sha)
    return {str(Path(tree['original']) / row['relative']): dict(row, label=label) for label, tree in index['roots'].items() for row in tree['files']}


def catalog_bindings(catalog, expected_sha):
    catalog = Path(catalog)
    if sha(catalog) != expected_sha:
        raise ValueError('Tree catalogue SHA256 differs')
    descriptor = json.loads(catalog.read_bytes())
    if descriptor.get('format') != 'wod-tree-retention-catalog' or descriptor.get('version') != 1:
        raise ValueError('Unsupported tree catalogue')
    archive = Path(descriptor['archive']['path'])
    if archive.stat().st_size != descriptor['archive']['bytes']:
        raise ValueError('Archive size differs from catalogue')
    result = bindings(archive, descriptor['archive']['sha256'])
    with zipfile.ZipFile(archive) as source:
        if hashlib.sha256(source.read(INDEX)).hexdigest() != descriptor['indexSHA256']:
            raise ValueError('Catalogue index binding differs')
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest='action', required=True)
    command = sub.add_parser('pack')
    command.add_argument('roots_json')
    command.add_argument('destination')
    command = sub.add_parser('restore')
    command.add_argument('archive')
    command.add_argument('label')
    command.add_argument('destination')
    command.add_argument('sha256')
    args = parser.parse_args()
    print(json.dumps(pack(json.loads(args.roots_json), args.destination) if args.action == 'pack' else restore(args.archive, args.label, args.destination, args.sha256)))
