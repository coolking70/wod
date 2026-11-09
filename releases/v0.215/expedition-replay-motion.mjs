// Presentation timing only; recorded HP/MP, outcomes and event order never change.
export function replayMotionTiming(speed=1){
 if(![.5,1,2,4].includes(speed))throw Error('回放速度无效');
 return{scale:1/speed,step:1300/speed,projectile:850/speed,slash:650/speed,ring:900/speed,float:1000/speed,reaction:650/speed,reactionDelay:120/speed,heal:800/speed,arrival:1000/speed};
}
export function beginReplayMotion(stage,{speed=1,reduced=false}={}){
 const timing=replayMotionTiming(speed);
 stage.style.setProperty('--replay-motion-scale',String(timing.scale));
 stage.dataset.motionState=reduced?'settled':'animated';return timing;
}
export function settleReplayMotion(stage,players=[]){
 for(const player of players)player?.cancel();
 if(stage)stage.dataset.motionState='settled';
}
