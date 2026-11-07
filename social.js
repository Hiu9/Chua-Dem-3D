'use strict';
function createSocial({online,notify,clearMovement}) {
  const el=id=>document.getElementById(id), dialog=el('cards-dialog');
  let mode=null, game=null, state=null, selected=new Set(), timer;
  const log=el('chat-log');
  function say(text){notify(text);el('cards-status').textContent=text;}
  function append(name,text){const row=document.createElement('p');const b=document.createElement('b');b.textContent=name+': ';row.append(b,document.createTextNode(text));log.append(row);while(log.children.length>80)log.firstChild.remove();log.scrollTop=log.scrollHeight;}
  el('chat-open').onclick=()=>{el('chat-panel').hidden=!el('chat-panel').hidden;clearMovement();};
  el('chat-close').onclick=()=>el('chat-panel').hidden=true;
  el('chat-input').onfocus=clearMovement;
  el('chat-form').onsubmit=e=>{e.preventDefault();const text=el('chat-input').value.trim();if(!online.running()){notify('Vào Chơi chung trước để chat.');return;}if(text){online.send({type:'chat',text});el('chat-input').value='';}};
  function card(c,selectable=false){const b=document.createElement('button');b.className='playing-card'+(c%4>=2?' red':'')+(selected.has(c)?' selected':'');const img=document.createElement('img');img.src='assets/cards/card-'+String(c).padStart(2,'0')+'.png';img.alt=TienLen.text(c);img.draggable=false;b.append(img);b.setAttribute('aria-label',TienLen.text(c));b.disabled=!selectable;b.setAttribute('aria-pressed',String(selected.has(c)));if(selectable)b.onclick=()=>{selected.has(c)?selected.delete(c):selected.add(c);render();};return b;}
  function localState(){return {...game,hand:game.hands[0],counts:game.hands.map(h=>h.length),seats:['Bạn','NPC An','NPC Bình','NPC Chi'],seat:0};}
  function render(){
    el('cards-menu').hidden=!!mode;
    const s=mode==='npc'&&game?localState():state;
    el('cards-status').textContent=s ? (s.notice||'')+(s.over?' · Thứ hạng: '+s.finished.map(i=>s.seats[i]).join(' → '):s.turn>=0?' · Lượt: '+s.seats[s.turn]:' · Chờ đủ 4 người') : 'Chọn chế độ chơi. Bàn trực tuyến có 4 ghế trong mỗi phòng.';
    el('cards-seats').replaceChildren();el('cards-hand').replaceChildren();el('cards-table').replaceChildren();
    if(s){s.seats.forEach((name,i)=>{const d=document.createElement('div');d.className='card-seat'+(s.turn===i?' current':'');d.textContent=(name||'Ghế trống')+(i===s.seat?' · Bạn':'')+' · '+(s.counts?.[i]??0)+' lá'+(s.passed?.includes(i)?' · Bỏ lượt':'');el('cards-seats').append(d);});(s.table||[]).forEach(c=>el('cards-table').append(card(c)));(s.hand||[]).forEach(c=>el('cards-hand').append(card(c,true)));}
    const myTurn=s&&s.turn===s.seat&&!s.over;
    el('cards-play').disabled=!myTurn||!selected.size;el('cards-pass').disabled=!myTurn||!s.lead;
    el('cards-start').hidden=!mode;el('cards-leave').hidden=!mode;
    el('cards-start').disabled=mode==='online' ? !s || s.seat!==s.host || s.seats.some(x=>!x) || (s.turn>=0&&!s.over) : !!game&&!game.over;
  }
  function step(){clearTimeout(timer);render();if(mode==='npc'&&game&&!game.over&&game.turn!==0){timer=setTimeout(()=>{const cs=TienLen.bot(game);const error=TienLen.act(game,game.turn,cs);if(error){say(error);return;}step();},750);}}
  function leave(){clearTimeout(timer);if(mode==='online')online.send({type:'cards_leave'});mode=null;game=null;state=null;selected.clear();render();}
  el('cards-npc').onclick=()=>{leave();mode='npc';game=TienLen.create();step();};
  el('cards-online').onclick=()=>{if(!online.running()){say('Vào Chơi chung, rồi ghé nhà để ngồi bàn trực tuyến.');return;}leave();mode='online';online.send({type:'cards_join'});render();};
  function act(cards){if(mode==='npc'){const error=TienLen.act(game,0,cards);if(error)say(error);else{selected.clear();step();}}else online.send({type:'cards_action',cards});}
  el('cards-play').onclick=()=>act([...selected]);el('cards-pass').onclick=()=>act([]);
  el('cards-start').onclick=()=>{selected.clear();if(mode==='npc'){game=TienLen.create();step();}else online.send({type:'cards_start'});};
  el('cards-leave').onclick=leave;
  el('cards-close').onclick=()=>dialog.close();
  dialog.addEventListener('close',clearMovement);
  window.addEventListener('room-left',()=>{el('chat-status').textContent='Đã rời phòng. Vào Chơi chung để chat.';log.replaceChildren();if(mode==='online'){leave();notify('Mất kết nối: bạn đã rời bàn bài.');}});
  window.addEventListener('room-message',({detail:m})=>{
    if(m.type==='welcome')el('chat-status').textContent='Tin nhắn chỉ gửi tới người đang ở cùng phòng.';
    if(m.type==='chat'){append(m.name,m.text);if(el('chat-panel').hidden)el('chat-open').textContent='Chat •';}
    if(m.type==='cards_state'){state=m;selected.clear();if(mode==='online')render();}
    if(m.type==='cards_error'){if(!state&&mode==='online'){mode=null;render();}say(m.text);}
  });
  el('chat-open').addEventListener('click',()=>el('chat-open').textContent='Chat');
  render();
  return {openCards(){clearMovement();render();if(!dialog.open)dialog.showModal();},blocked:()=>dialog.open||document.getElementById('caro-online-dialog').open||document.activeElement===el('chat-input')};
}
