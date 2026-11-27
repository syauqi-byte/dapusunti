'use strict';
const NOMOR_WHATSAPP = '';
const produk = [
  {id:'gayo', nama:'Arabika Gayo', kategori:'Biji kopi', unit:'200 g', harga:85000, foto:'gayo'},
  {id:'latte', nama:'Es Kopi Susu', kategori:'Minuman', unit:'250 ml', harga:24000, foto:'latte'},
  {id:'dripper', nama:'Dripper V60', kategori:'Alat seduh', unit:'1 buah', harga:95000, foto:'alat'},
  {id:'blend', nama:'House Blend', kategori:'Biji kopi', unit:'250 g', harga:75000, foto:'hero'}
];
const $ = id => document.getElementById(id);
const uang = n => new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n);
const key = 'sela-kopi.cart.v1';
let kategori = 'Semua', timer;
function el(tag, teks, kelas) {
  const n = document.createElement(tag);
  if (teks !== undefined) n.textContent = teks;
  if (kelas) n.className = kelas;
  return n;
}
function baca() {
  const cart = {};
  try {
    const raw = JSON.parse(localStorage.getItem(key));
    for (const p of produk) if (Number.isInteger(raw?.[p.id]) && raw[p.id]>0 && raw[p.id]<=99) cart[p.id]=raw[p.id];
  } catch {}
  return cart;
}
let cart = baca();
function tombol(teks, label, aksi) {
  const b=el('button',teks); b.type='button'; b.setAttribute('aria-label',label); b.addEventListener('click',aksi); return b;
}
function notifikasi(teks) {
  clearTimeout(timer); $('toast').textContent=teks;
  timer=setTimeout(()=>{$('toast').textContent='';},2400);
}
function ubah(p, beda) {
  const jumlah=(cart[p.id] || 0)+beda;
  if (jumlah>99) {notifikasi('Maksimal 99 per produk.'); return;}
  if (jumlah>0) cart[p.id]=jumlah; else delete cart[p.id];
  let pesan=beda>0?p.nama+' ditambahkan.':'Jumlah diperbarui.';
  try {localStorage.setItem(key,JSON.stringify(cart));} catch {pesan+=' Keranjang hanya tersimpan selama halaman terbuka.';}
  tampilKeranjang(); notifikasi(pesan);
}
function katalog() {
  const cari=$('query').value.trim().slice(0,80).toLocaleLowerCase('id-ID');
  const daftar=produk.filter(p=>(kategori==='Semua'||p.kategori===kategori) && (p.nama+' '+p.kategori).toLocaleLowerCase('id-ID').includes(cari));
  $('grid').replaceChildren(); $('results').textContent=daftar.length+' produk ditemukan.';
  for (const p of daftar) {
    const card=el('article',undefined,'card'), img=el('img'), detail=el('div',undefined,'details'), row=el('div',undefined,'price-row');
    img.src='assets/'+p.foto+'.webp'; img.alt=p.nama; img.loading='lazy';
    row.append(el('strong',uang(p.harga)),tombol('+','Tambahkan '+p.nama,()=>ubah(p,1)));
    detail.append(el('p',p.kategori+' · '+p.unit,'meta'),el('h3',p.nama),row); card.append(img,detail); $('grid').append(card);
  }
  if (!daftar.length) $('grid').append(el('p','Produk tidak ditemukan. Coba kata lain atau pilih kategori Semua.'));
}
function tampilKeranjang() {
  const fokus=document.activeElement?.dataset.kontrol;
  let total=0, jumlah=0;
  const pesan=['Halo Sela Kopi, saya ingin memesan:'];
  $('lines').replaceChildren();
  for (const p of produk) {
    const qty=cart[p.id]; if (!qty) continue;
    jumlah+=qty; total+=p.harga*qty;
    const row=el('div',undefined,'line'), step=el('div',undefined,'step');
    for (const beda of [-1,1]) {
      const b=tombol(beda===1?'+':'−',(beda===1?'Tambah ':'Kurangi ')+p.nama,()=>ubah(p,beda));
      b.dataset.kontrol=p.id+beda; b.disabled=beda===1 && qty===99;
      if (beda===1) step.append(el('span',String(qty))); step.append(b);
    }
    row.append(el('strong',p.nama),el('small',p.unit+' · '+uang(qty*p.harga)),step); $('lines').append(row);
    pesan.push(qty+' × '+p.nama+' ('+p.unit+') — '+uang(qty*p.harga));
  }
  if (!jumlah) $('lines').append(el('p','Keranjang masih kosong. Pilih produk dari katalog.'));
  $('count').textContent=String(jumlah); $('sum').textContent=uang(total);
  const nomor=/^[1-9]\d{6,14}$/.test(NOMOR_WHATSAPP)?NOMOR_WHATSAPP:'';
  $('recipient').textContent=jumlah && !nomor?'Pilih kontak kedai di WhatsApp untuk mengirim pesanan.':'';
  const url=new URL('https://wa.me/'+nomor);
  url.searchParams.set('text',[...pesan,'Subtotal: '+uang(total),'Mohon konfirmasi ketersediaan dan ongkir.'].join('\n'));
  $('order').href=url.href; $('order').hidden=!jumlah;
  if (fokus && $('cart').open) ([...$('lines').querySelectorAll('button')].find(b=>b.dataset.kontrol===fokus && !b.disabled)||$('close')).focus();
}
for (const k of ['Semua',...new Set(produk.map(p=>p.kategori))]) {
  const b=tombol(k,'Kategori '+k,()=>{
    kategori=k;
    for (const item of $('filters').children) item.setAttribute('aria-pressed',String(item===b));
    katalog();
  });
  b.setAttribute('aria-pressed',String(k===kategori)); $('filters').append(b);
}
$('query').addEventListener('input',katalog);
$('open').addEventListener('click',()=>$('cart').showModal());
$('close').addEventListener('click',()=>$('cart').close());
window.addEventListener('storage',e=>{if (e.key===key || e.key===null) {cart=baca(); tampilKeranjang();}});
katalog(); tampilKeranjang();
