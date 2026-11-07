'use strict';
function createCaroOnline({online,notify,clearMovement,onFinish}) {
  const el=id=>document.getElementById(id),dialog=el('caro-online-dialog');
  const cells=[];
  let state=null,joined=false,awarded=null;
  function status(text){el('caro-online-status').textContent=text;}
  for(let i=0;i<169;i++){
    const cell=document.createElement('button');cell.type='button';cell.disabled=true;
    cell.addEventListener('click',()=>{
      if(joined&&state?.status==='playing'&&state.turn===state.seat+1&&!state.board[i])online.send({type:'caro_move',index:i});
    });
    cells.push(cell);el('caro-online-grid').append(cell);
  }
  function render(){
    const s=state;
    status(s?.notice||'Đang tìm đối thủ cùng phòng…');
    el('caro-online-players').textContent=s ? s.names.map((n,i)=>(i?'O: ':'X: ')+(n||'Đang chờ người chơi')+(i===s.seat?' (Bạn)':'')).join(' · ') : 'Bàn 2 chỗ · Vào cùng phòng và cùng chọn chế độ người thật.';
    cells.forEach((cell,i)=>{const mark=s?.board[i]||0;cell.textContent=mark===1?'X':mark===2?'O':'';cell.className=mark===1?'player':mark===2?'opponent':'';cell.disabled=!joined||s?.status!=='playing'||s.turn!==s.seat+1||!!mark;cell.setAttribute('aria-label','Hàng '+(Math.floor(i/13)+1)+', cột '+(i%13+1)+(mark?' '+cell.textContent:''));});
    el('caro-rematch').hidden=s?.status!=='finished';
    el('caro-rematch').disabled=!!s?.ready?.includes(s.seat);
    el('caro-rematch').textContent=el('caro-rematch').disabled?'Đang chờ đối thủ sẵn sàng':'Sẵn sàng ván mới';
  }
  function leave(){if(joined&&online.running())online.send({type:'caro_leave'});joined=false;state=null;render();}
  el('caro-online-close').onclick=()=>dialog.close();
  el('caro-online-leave').onclick=()=>{leave();dialog.close();};
  el('caro-rematch').onclick=()=>online.send({type:'caro_rematch'});
  dialog.addEventListener('close',clearMovement);
  window.addEventListener('room-left',()=>{if(joined){leave();status('Đã mất kết nối. Đóng bàn rồi vào lại phòng.');}});
  window.addEventListener('room-message',({detail:m})=>{
    if(m.type==='caro_error'){if(!state)joined=false;status(m.text);return;}
    if(m.type!=='caro_state'||!joined)return;
    state=m;render();
    if(m.status==='finished'&&m.round!==awarded){awarded=m.round;onFinish();}
  });
  render();
  return {open(){clearMovement();if(!online.running()){notify('Hãy vào Chơi chung trước.');return;}if(!joined){joined=true;state=null;render();online.send({type:'caro_join'});}if(!dialog.open)dialog.showModal();}};
}
