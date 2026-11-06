import {postQuestProgress} from './expedition-post-quest.mjs';
import {foundryStoryProgress} from './expedition-foundry-story.mjs';import {harborStoryProgress} from './expedition-harbor-story.mjs';import {clocktowerStoryProgress} from './expedition-clocktower-story.mjs';
// Optional next steps based only on already claimed progress; never grants rewards.
export function campJourneyProgress(g){return [...(g.postQuest?[['postquest','归信航程',postQuestProgress]]:[]),['harbor','灯塔来信',harborStoryProgress],['foundry','铸库归航',foundryStoryProgress],['clocktower','潮刻余响',clocktowerStoryProgress]].map(([id,label,progress])=>{const p=progress(g);return {id,label,completed:p.completed,ready:p.ready,canClaim:p.canClaim,ending:p.ending};}).filter(p=>(p.completed>0||p.id==='postquest')&&!p.ending);}
