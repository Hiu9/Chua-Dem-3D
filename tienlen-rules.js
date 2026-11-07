'use strict';
// Card IDs increase 3♠,3♣,3♦,3♥,...,2♥. Same engine on browser and server.
const TienLen = (() => {
  const rank = c => Math.floor(c / 4), suit = c => c % 4;
  function combo(cards) {
    if (!Array.isArray(cards) || !cards.length || cards.some(c => !Number.isInteger(c) || c < 0 || c > 51) || new Set(cards).size !== cards.length) return null;
    const a = [...cards].sort((a,b)=>a-b), ranks = [...new Set(a.map(rank))];
    const n = a.length, high = a[n-1];
    let type;
    if (ranks.length === 1 && n <= 4) type = ['','single','pair','triple','four'][n];
    else if (n >= 3 && ranks.length === n && ranks[n-1] < 12 && ranks.every((r,i)=>!i || r===ranks[i-1]+1)) type = 'straight';
    else if ((n === 6 || n === 8) && ranks.length === n/2 && ranks[ranks.length-1] < 12 && ranks.every((r,i)=>a.filter(c=>rank(c)===r).length===2 && (!i || r===ranks[i-1]+1))) type = 'pairs';
    return type ? {type,n,high,rank:rank(high)} : null;
  }
  function beats(a,b) {
    if (!a) return false;
    if (!b) return true;
    if (a.type===b.type && a.n===b.n) return a.high>b.high;
    if (b.type==='single' && b.rank===12) return a.type==='four' || (a.type==='pairs' && a.n>=6);
    if ((b.type==='pair' && b.rank===12) || b.type==='four' || (b.type==='pairs' && b.n===6)) return a.type==='pairs' && a.n>=8 || a.type==='four' && b.type==='pairs' && b.n===6;
    return false;
  }
  function create(random=Math.random) {
    const deck=Array.from({length:52},(_,i)=>i);
    for(let i=51;i>0;i--){const j=Math.floor(random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}
    const hands=Array.from({length:4},(_,i)=>deck.slice(i*13,i*13+13).sort((a,b)=>a-b));
    return {hands,turn:hands.findIndex(h=>h.includes(0)),lead:null,last:-1,passed:[],first:true,finished:[],over:false,notice:'Ván mới: người giữ 3♠ đi trước, lượt đầu phải có 3♠.'};
  }
  function next(g,from) { for(let k=1;k<=4;k++){const i=(from+k)%4;if(g.hands[i].length&&!g.passed.includes(i))return i;} return -1; }
  function act(g,seat,cards) {
    if(g.over || g.turn!==seat)return 'Chưa đến lượt bạn.';
    if(!Array.isArray(cards))return 'Bài không hợp lệ.';
    if(!cards.length){
      if(!g.lead)return 'Bạn đang mở vòng, phải đánh bài.';
      g.passed.push(seat);g.notice='Người chơi '+(seat+1)+' bỏ lượt.';
    }else{
      const c=combo(cards);
      if(!c || cards.some(x=>!g.hands[seat].includes(x)))return 'Bộ bài không hợp lệ.';
      if(g.first&&!cards.includes(0))return 'Lượt đầu phải chứa 3♠.';
      if(!beats(c,g.lead))return 'Bài chưa chặn được bộ hiện tại.';
      g.hands[seat]=g.hands[seat].filter(x=>!cards.includes(x));
      g.lead=c;g.table=[...cards].sort((a,b)=>a-b);g.last=seat;g.first=false;g.notice='Người chơi '+(seat+1)+' vừa đánh.';
      if(!g.hands[seat].length)g.finished.push(seat);
      if(g.finished.length===3){g.finished.push(g.hands.findIndex(h=>h.length));g.over=true;g.turn=-1;g.notice='Kết thúc ván!';return null;}
    }
    let n=next(g,seat);
    if(n===-1 || n===g.last){
      const last=g.last;g.passed=[];g.lead=null;g.table=[];
      g.turn=g.hands[last]?.length ? last : next(g,last);g.notice+=' Vòng mới.';
    }else g.turn=n;
    return null;
  }
  function candidates(hand) {
    const a=[...hand].sort((a,b)=>a-b), out=[];
    for(let mask=1;mask<(1<<a.length);mask++){
      const cs=a.filter((_,i)=>mask&(1<<i));if(combo(cs))out.push(cs);
    }
    return out.sort((a,b)=>a.length-b.length || a[a.length-1]-b[b.length-1]);
  }
  function bot(g) {return candidates(g.hands[g.turn]).find(cs=>(!g.first||cs.includes(0))&&beats(combo(cs),g.lead))||[];}
  const text=c=>['3','4','5','6','7','8','9','10','J','Q','K','A','2'][rank(c)]+['♠','♣','♦','♥'][suit(c)];
  return {combo,beats,create,act,bot,text};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=TienLen;
