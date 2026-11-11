import {defaults,row,clone,roomsFor} from '../dist/expedition-data.mjs';
import {newGuild,depart,claim,learnAdvanced,pendingReport} from '../dist/expedition-guild.mjs';
import {selectHero,setCompanion} from '../dist/expedition-command.mjs';
import {defaultCoursePreview,installDefaultCourse} from '../dist/expedition-course-install.mjs';
export function courseInstallCases(){
 let guild=selectHero(newGuild(),'b'),config=defaults();const reports=[];
 for(const route of ['tutorial','classic','classic']){config.expedition=route;const pending=depart(guild,config);reports.push(pendingReport(pending));guild=claim(pending);}
 const beforeLearning=clone(guild);guild=learnAdvanced(guild,'b');config=clone(config);const hero=config.heroes.find(h=>h.id==='b'),rooms=roomsFor(config);
 hero.overrides[rooms[0].id]={...hero.overrides[rooms[0].id],main:[row('shot','front')]};hero.overrides[rooms[1].id]={...hero.overrides[rooms[1].id],main:[],prep:[]};
 const preview=defaultCoursePreview(guild,config,'b'),edit=installDefaultCourse(guild,config,'b');
 return {guild,config,beforeLearning,preview,edit,reports,rooms};
}
