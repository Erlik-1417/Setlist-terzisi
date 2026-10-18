import test from 'node:test';
import assert from 'node:assert/strict';
import {makePlan,ruleOrder,totalSeconds,clockTime,validateSettings} from '../public/planner.js';
const event={duration:60,setCount:2,breakMin:10,start:'23:30',flow:'rise',protect:true};
const songs=Array.from({length:20},(_,i)=>({id:String(i),title:`Song ${i}`,seconds:180+i*7,energy:i%5+1,vocal:i%3+1}));
test('no duplicates, inventions, or lost accounting; music plus breaks fits budget',()=>{
const p=makePlan(songs,event,ruleOrder(songs,event));const ids=p.sets.flat().map(s=>s.id);assert.equal(ids.length,new Set(ids).size);assert.equal(ids.length+p.unused.length,songs.length);assert.ok(totalSeconds(p.sets.flat())+600<=3600);for(const set of p.sets)assert.ok(totalSeconds(set)<=1500);
});
test('midnight rollover is explicit',()=>assert.equal(clockTime('23:30',3600),'00:30 (+1 gün)'));
test('impossible breaks and empty time rejected',()=>{assert.throws(()=>validateSettings({...event,duration:10,setCount:3}));assert.throws(()=>validateSettings({...event,start:''}));});
test('too-long songs excluded, empty repertoire supported',()=>{const long=[{...songs[0],seconds:3500}];assert.equal(makePlan(long,event,['0']).sets.flat().length,0);assert.equal(makePlan([],event,[]).sets.length,2);});
test('model output must be a complete permutation',()=>{assert.throws(()=>makePlan(songs,event,songs.map(()=> '0')));assert.throws(()=>makePlan(songs,event,['invented']));});
test('vocal protection separates difficult songs when possible',()=>{const list=[{...songs[0],id:'a',vocal:3},{...songs[1],id:'b',vocal:3},{...songs[2],id:'c',vocal:1}];const p=makePlan(list,{...event,setCount:1},['a','b','c']);assert.deepEqual(p.sets[0].map(s=>s.vocal),[3,1,3]);});
