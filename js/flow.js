/* Minimal flowchart renderer.
   Node spec: {s:'start'|'end'|'proc'|'io'|'dec'|'sub', t:'label', yes:'text', no:'text'}
   Nodes are drawn top-to-bottom with connecting arrows.
   Decision nodes show Yes/No exit labels (e.g. "Yes → step 2"). */
function renderFlow(nodes){
  const W=320, boxW=210, boxH=44, gap=34, cx=W/2;
  let y=12, parts=[], H=0;
  const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  function label(x,yy,t,size,anchor){
    const lines=String(t).split('\n');
    const lh=size+3, y0=yy-((lines.length-1)*lh)/2;
    return lines.map((ln,i)=>`<text x="${x}" y="${y0+i*lh}" font-size="${size}" text-anchor="${anchor||'middle'}" dominant-baseline="middle" font-family="Arial,Helvetica,sans-serif">${esc(ln)}</text>`).join('');
  }

  nodes.forEach((n,i)=>{
    const isDec=n.s==='dec';
    const h=isDec?64:boxH;
    const top=y, mid=top+h/2;
    let shape='';
    if(n.s==='start'||n.s==='end'){
      shape=`<rect x="${cx-boxW/2}" y="${top}" width="${boxW}" height="${boxH}" rx="${boxH/2}" fill="#e3f4ef" stroke="#007a87" stroke-width="1.6"/>`;
    }else if(n.s==='proc'){
      shape=`<rect x="${cx-boxW/2}" y="${top}" width="${boxW}" height="${boxH}" fill="#fff" stroke="#1c2226" stroke-width="1.4"/>`;
    }else if(n.s==='sub'){
      shape=`<rect x="${cx-boxW/2}" y="${top}" width="${boxW}" height="${boxH}" fill="#fff" stroke="#1c2226" stroke-width="1.4"/>
             <line x1="${cx-boxW/2+10}" y1="${top}" x2="${cx-boxW/2+10}" y2="${top+boxH}" stroke="#1c2226" stroke-width="1.4"/>
             <line x1="${cx+boxW/2-10}" y1="${top}" x2="${cx+boxW/2-10}" y2="${top+boxH}" stroke="#1c2226" stroke-width="1.4"/>`;
    }else if(n.s==='io'){
      const sk=16;
      shape=`<polygon points="${cx-boxW/2+sk},${top} ${cx+boxW/2},${top} ${cx+boxW/2-sk},${top+boxH} ${cx-boxW/2},${top+boxH}" fill="#fff" stroke="#1c2226" stroke-width="1.4"/>`;
    }else if(isDec){
      shape=`<polygon points="${cx},${top} ${cx+boxW/2+8},${mid} ${cx},${top+h} ${cx-boxW/2-8},${mid}" fill="#fffbe8" stroke="#1c2226" stroke-width="1.4"/>`;
    }
    parts.push(shape, label(cx, mid, n.t, 12));

    if(isDec){
      if(n.yes) parts.push(label(cx+boxW/2+14, mid, 'Yes: '+n.yes, 11, 'start'));
      if(n.no)  parts.push(label(cx-boxW/2-14, mid, 'No: '+n.no, 11, 'end'));
    }
    y=top+h;
    if(i<nodes.length-1){
      parts.push(`<line x1="${cx}" y1="${y}" x2="${cx}" y2="${y+gap-8}" stroke="#1c2226" stroke-width="1.4"/>
                  <polygon points="${cx-5},${y+gap-9} ${cx+5},${y+gap-9} ${cx},${y+gap}" fill="#1c2226"/>`);
      y+=gap;
    }
    H=y+16;
  });
  return `<svg viewBox="0 0 ${W+140} ${H}" width="100%" style="max-width:460px" role="img" aria-label="Flowchart"><g transform="translate(70,0)">${parts.join('')}</g></svg>`;
}
