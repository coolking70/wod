"""Check physical bindings, original-ZIP recipes and exact tree snapshots without changing inputs."""
from pathlib import Path
import hashlib, importlib.util, stat


def load(name):
    spec = importlib.util.spec_from_file_location(name.replace('-', '_'), Path(__file__).with_name(name + '.py'))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def verify(rows, zip_catalog, zip_catalog_sha, tree_catalogs=(), cold_zips=False, file_catalogs=()):
    store, trees = load('durable-evidence-store'), load('durable-tree-evidence')
    bindings = {}
    for catalog in tree_catalogs:
        for path, row in trees.catalog_bindings(catalog['path'], catalog['sha256']).items():
            if path in bindings and bindings[path] != row:
                raise ValueError('Conflicting tree binding')
            bindings[path] = row
    file_bindings = {}
    for catalog in file_catalogs:
        for path, row in load('file-binding-evidence').catalog_bindings(catalog['path'], catalog['sha256']).items():
            if path in file_bindings and file_bindings[path] != row:
                raise ValueError('Conflicting recovered file binding')
            file_bindings[path] = row
    physical, zip_rows, tree_rows, recovered_rows = [], [], [], []
    for row in rows:
        path = Path(row['path'])
        if path.is_symlink():
            raise ValueError('Protected path became a symlink')
        if path.exists():
            value = path.stat()
            with path.open('rb') as stream:
                digest = hashlib.file_digest(stream, 'sha256').hexdigest()
            actual = dict(bytes=value.st_size, sha256=digest, mode=stat.S_IMODE(value.st_mode), mtimeNs=value.st_mtime_ns)
            if any(actual[key] != row[key] for key in actual if key in row):
                raise ValueError('Physical protected binding differs: ' + str(path))
            physical.append(str(path))
        elif str(path) in bindings:
            binding = bindings[str(path)]
            if any(binding[key] != row[key] for key in ['bytes', 'sha256', 'mode', 'mtimeNs'] if key in row):
                raise ValueError('Original tree metadata differs: ' + str(path))
            tree_rows.append(str(path))
        elif str(path) in file_bindings:
            binding = file_bindings[str(path)]
            if any(key not in binding or binding[key] != row[key] for key in ['bytes', 'sha256', 'mode', 'mtimeNs'] if key in row):
                raise ValueError('Recovered recorded file field differs: ' + str(path))
            recovered_rows.append(str(path))
        else:
            zip_rows.append(row)
    # Original-ZIP recipes retain their existing independent decoder and metadata checks.
    old = None
    for row in zip_rows:
        binding = store.load_record(row['path'], zip_catalog, zip_catalog_sha, row['sha256'])
        if any(binding[key] != row[key] for key in ['bytes', 'sha256', 'mode', 'mtimeNs'] if key in row):
            raise ValueError('Original ZIP metadata differs')
    if zip_rows and cold_zips:
        old = store.verify_rows(zip_rows, catalog=zip_catalog, catalog_sha256=zip_catalog_sha)
    return dict(passed=True, physicalFiles=len(physical), originalZIPs=len(zip_rows), originalTreeFiles=len(tree_rows), logicalTreePaths=tree_rows, recoveredFileBindings=len(recovered_rows), zipProof=old, freshZIPRecoveryRun=cold_zips, treeObjectsSHA256AndMetadataVerified=True, freshWholeTreeColdRestoreNotClaimed=True)
