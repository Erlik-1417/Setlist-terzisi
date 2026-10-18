export function validateSettings(event) {
  if (!Number.isInteger(event.duration) || event.duration < 10 || event.duration > 480) throw Error('Toplam süre 10–480 dakika olmalı.');
  if (!Number.isInteger(event.setCount) || event.setCount < 1 || event.setCount > 5) throw Error('Set sayısı 1–5 olmalı.');
  if (!Number.isInteger(event.breakMin) || event.breakMin < 0 || event.breakMin > 60) throw Error('Mola 0–60 dakika olmalı.');
  if ((event.setCount - 1) * event.breakMin >= event.duration) throw Error('Molalar programın tamamını dolduruyor. Süreyi veya mola sayısını değiştir.');
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(event.start)) throw Error('Başlangıç saatini gir.');
}

export function ruleOrder(songs, event) {
  let pool = [...songs], order = [], previous;
  while (pool.length) {
    const progress = order.length / Math.max(1, songs.length - 1);
    const target = event.flow === 'high' ? 4.5 : event.flow === 'wave' ? 3 - 1.8 * Math.cos(progress * Math.PI * 4) : 1.5 + 3.5 * progress;
    pool.sort((a,b) => {
      const score = s => Math.abs(s.energy - target) + (event.protect && previous?.vocal === 3 && s.vocal === 3 ? 5 : 0);
      return score(a) - score(b) || a.title.localeCompare(b.title, 'tr');
    });
    previous = pool.shift(); order.push(previous.id);
  }
  return order;
}
export function makePlan(songs, event, order) {
  validateSettings(event);
  if (songs.some(s => !Number.isInteger(s.seconds) || s.seconds < 1 || s.seconds > 3599)) throw Error('Şarkı süreleri 0:01–59:59 arasında olmalı.');
  const byId = new Map(songs.map(s => [s.id, s]));
  if (order.length !== songs.length || new Set(order).size !== songs.length || order.some(id => !byId.has(id))) throw Error('Şarkı sıralaması geçersiz.');
  let remaining = order.map(id => byId.get(id));
  const musicBudget = (event.duration - (event.setCount - 1) * event.breakMin) * 60;
  const perSet = Math.floor(musicBudget / event.setCount);
  const sets = [];
  for (let k = 0; k < event.setCount; k++) {
    const capacity = perSet + (k === event.setCount - 1 ? musicBudget % event.setCount : 0);
    const paths = new Map([[0, []]]);
    for (let i = 0; i < remaining.length; i++) {
      for (const [total, indexes] of [...paths.entries()].sort((a,b) => b[0] - a[0])) {
        const next = total + remaining[i].seconds;
        if (next <= capacity && !paths.has(next)) paths.set(next, [...indexes, i]);
      }
    }
    const best = Math.max(...paths.keys());
    const selected = new Set(paths.get(best));
    let tracks = remaining.filter((_, i) => selected.has(i));
    if (event.protect) for (let i = 1; i < tracks.length; i++) {
      if (tracks[i-1].vocal === 3 && tracks[i].vocal === 3) {
        const next = tracks.findIndex((s,j) => j > i && s.vocal < 3);
        if (next !== -1) [tracks[i], tracks[next]] = [tracks[next], tracks[i]];
      }
    }
    sets.push(tracks);
    remaining = remaining.filter((_, i) => !selected.has(i));
  }
  return {sets, unused: remaining, musicBudget};
}

export const totalSeconds = tracks => tracks.reduce((sum,s) => sum+s.seconds,0);
export function clockTime(start, seconds) {
  const [h,m] = start.split(':').map(Number);
  const mins = h*60+m+Math.floor(seconds/60);
  return `${String(Math.floor(mins/60)%24).padStart(2,'0')}:${String(mins%60).padStart(2,'0')}${mins>=1440?' (+1 gün)':''}`;
}
export const trackTime = seconds => `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;
