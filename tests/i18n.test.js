import test from 'node:test';
import assert from 'node:assert/strict';
import {t,setLanguage,getLanguage,messages} from '../public/i18n.js';
import {englishSongs} from '../public/english-songs.js';

test('language switch translates labels and can return to Turkish',()=>{
 setLanguage('en');
 assert.equal(getLanguage(),'en');
 assert.equal(t('Setimi oluştur'),'Build my set');
 setLanguage('tr');
 assert.equal(t('Setimi oluştur'),'Setimi oluştur');
});
test('translated templates preserve song names and values',()=>{
 setLanguage('en');
 assert.equal(t('Süreye sığmayan {count} şarkı: {songs}.',{count:2,songs:'Yellow, Wonderwall'}),'2 songs did not fit: Yellow, Wonderwall.');
 setLanguage('tr');
 assert.equal(t('Süreye sığmayan {count} şarkı: {songs}.',{count:2,songs:'Yellow, Wonderwall'}),'Süreye sığmayan 2 şarkı: Yellow, Wonderwall.');
});
test('English repertoire contains sixteen unique valid entries',()=>{
 assert.equal(englishSongs.length,16);
 assert.equal(new Set(englishSongs.map(s=>s.id)).size,16);
 for(const song of englishSongs){assert.ok(song.seconds>0&&song.seconds<3600);assert.ok(song.energy>=1&&song.energy<=5);assert.ok(song.vocal>=1&&song.vocal<=3);}
});
test('translation placeholders match in both languages',()=>{
 for(const [source,target] of Object.entries(messages)){
  const slots=text=>(text.match(/\{\w+\}/g)||[]).sort();
  assert.deepEqual(slots(source),slots(target),source);
 }
});
