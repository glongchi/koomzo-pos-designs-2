/* Koomzo Grocery — a quartier shop in Douala. Weighed produce, PLU codes, crate
   deposits, multibuys and short dates. Money is XAF: integers, no minor units. */
window.GR = {
  shop: 'Alimentation Bilongue',
  city: 'Douala · Bonapriso',
  today: 'Sunday 16 August 2026',
  ccy: 'FCFA', vat: 0.1925,
  cats: [
    { id:'all',    name:'All',        icon:'grid-outline' },
    { id:'produce',name:'Produce',    icon:'leaf-outline' },
    { id:'staple', name:'Staples',    icon:'nutrition-outline' },
    { id:'drink',  name:'Drinks',     icon:'beer-outline' },
    { id:'chilled',name:'Chilled',    icon:'snow-outline' },
    { id:'home',   name:'Household',  icon:'home-outline' },
  ],
  /* sold: each | weight. plu is typed on the keypad for loose goods.
     age = minimum age. deposit = crate or bottle charged alongside. */
  items: [
    { id:'p1', name:'Plantain',        cat:'produce', sold:'weight', perKg:900,  plu:'41', loc:'A1', stock:38, icon:'leaf-outline',      tint:'#2e9e5b' },
    { id:'p2', name:'Tomatoes',        cat:'produce', sold:'weight', perKg:1200, plu:'42', loc:'A1', stock:22, icon:'nutrition-outline', tint:'#c1543a' },
    { id:'p3', name:'Onions',          cat:'produce', sold:'weight', perKg:800,  plu:'43', loc:'A2', stock:31, icon:'ellipse-outline',   tint:'#b4791c' },
    { id:'p4', name:'Green pepper',    cat:'produce', sold:'weight', perKg:1500, plu:'44', loc:'A2', stock:9,  icon:'leaf-outline',      tint:'#2e9e5b' },
    { id:'s1', name:'Rice 5 kg',       cat:'staple',  sold:'each',   price:4500,  loc:'B1', stock:26, icon:'cube-outline',      tint:'#6a61bf' },
    { id:'s2', name:'Garri 1 kg',      cat:'staple',  sold:'each',   price:1100,  loc:'B1', stock:44, icon:'cube-outline',      tint:'#b4791c' },
    { id:'s3', name:'Palm oil 1 L',    cat:'staple',  sold:'each',   price:1800,  loc:'B2', stock:19, icon:'water-outline',     tint:'#ec603a' },
    { id:'s4', name:'Sugar 1 kg',      cat:'staple',  sold:'each',   price:950,   loc:'B2', stock:33, icon:'cube-outline',      tint:'#528cef' },
    { id:'s5', name:'Sardines tin',    cat:'staple',  sold:'each',   price:650,   loc:'B3', stock:61, icon:'fish-outline',      tint:'#528cef' },
    { id:'d1', name:'Castel 65 cl',    cat:'drink',   sold:'each',   price:900,   loc:'C1', stock:96, age:18, deposit:200, icon:'beer-outline', tint:'#2e9e5b' },
    { id:'d2', name:'Guinness 33 cl',  cat:'drink',   sold:'each',   price:1000,  loc:'C1', stock:72, age:18, deposit:200, icon:'beer-outline', tint:'#3d3a34' },
    { id:'d3', name:'Whisky 70 cl',    cat:'drink',   sold:'each',   price:12500, loc:'C2', stock:6,  age:21, icon:'wine-outline',      tint:'#b4791c' },
    { id:'d4', name:'Top Ananas 1 L',  cat:'drink',   sold:'each',   price:1200,  loc:'C2', stock:40, deposit:200, icon:'nutrition-outline', tint:'#d0a01a' },
    { id:'d5', name:'Water 1.5 L',     cat:'drink',   sold:'each',   price:500,   loc:'C3', stock:120,icon:'water-outline',     tint:'#528cef' },
    { id:'c1', name:'Milk 1 L',        cat:'chilled', sold:'each',   price:1400,  loc:'D1', stock:24, icon:'cafe-outline',      tint:'#528cef' },
    { id:'c2', name:'Yoghurt 500 g',   cat:'chilled', sold:'each',   price:1600,  loc:'D1', stock:14, icon:'ice-cream-outline', tint:'#c2497e' },
    { id:'c3', name:'Chicken 1 kg',    cat:'chilled', sold:'weight', perKg:3200, plu:'71', loc:'D2', stock:11, icon:'restaurant-outline', tint:'#ec603a' },
    { id:'h1', name:'Soap bar',        cat:'home',    sold:'each',   price:400,   loc:'E1', stock:88, icon:'sparkles-outline',  tint:'#2e9e5b' },
    { id:'h2', name:'Bleach 1 L',      cat:'home',    sold:'each',   price:1300,  loc:'E1', stock:17, icon:'flask-outline',     tint:'#528cef' },
    { id:'h3', name:'Charcoal 5 kg',   cat:'home',    sold:'each',   price:2500,  loc:'E2', stock:12, icon:'flame-outline',     tint:'#3d3a34' },
  ],
  /* server-side pricing in the real thing; here they are declared and applied at tender */
  promos: [
    { id:'pr1', kind:'multibuy', items:['s5'], trigger:3, pay:2, label:'Sardines · 3 for the price of 2', ends:'31 Aug' },
    { id:'pr2', kind:'mix',      items:['h1','h2'], trigger:2, off:15, label:'Household · any 2, 15% off', ends:'24 Aug' },
    { id:'pr3', kind:'timed',    items:['c1'], price:1200, label:'Milk 1 L at 1 200 F after 18:00', ends:'Daily', from:18 },
  ],
  /* short-dated lots on the shelf */
  dated: [
    { id:'l1', item:'c1', lot:'MK-2208', days:1, qty:6,  markdown:null },
    { id:'l2', item:'c2', lot:'YG-1908', days:2, qty:4,  markdown:800 },
    { id:'l3', item:'c3', lot:'CH-1608', days:0, qty:3,  markdown:null },
    { id:'l4', item:'p2', lot:'TM-1508', days:1, qty:7,  markdown:null },
    { id:'l5', item:'s3', lot:'PO-0109', days:12, qty:9, markdown:null },
    { id:'l6', item:'c1', lot:'MK-2308', days:4, qty:12, markdown:null },
  ],
  waste: [
    { id:'w1', item:'p2', qty:'2.4 kg', reason:'spoiled', cost:2100, at:'Yesterday · 18:40', by:'u2' },
    { id:'w2', item:'c2', qty:'2',      reason:'expired', cost:2400, at:'14 Aug · 19:10', by:'u1' },
  ],
  /* what the aisle walk found this morning */
  gaps: [
    { item:'s1', shelf:'B1', par:36, onHand:26, sug:12, sup:'Sodicam' },
    { item:'d5', shelf:'C3', par:180, onHand:120, sug:60, sup:'Source du Pays' },
    { item:'p4', shelf:'A2', par:20, onHand:9, sug:12, sup:'Marché Mboppi' },
    { item:'c1', shelf:'D1', par:48, onHand:24, sug:24, sup:'Camlait' },
  ],
  /* price changes waiting on a printed label */
  labels: [
    { item:'s3', from:1650, to:1800, reason:'price change', at:'Today · 07:20' },
    { item:'p2', from:1000, to:1200, reason:'price change', at:'Today · 07:20' },
    { item:'s5', from:650,  to:650,  reason:'promo start',  at:'Today · 08:00' },
    { item:'c2', from:1600, to:800,  reason:'markdown',     at:'Today · 09:15' },
  ],
  members: [
    { id:'m1', name:'Mme Ekwalla', phone:'+237 6 99 12 40 55', pts:2140, staff:false },
    { id:'m2', name:'Bertrand N.', phone:'+237 6 77 80 21 09', pts:640,  staff:false },
    { id:'m3', name:'Sylvie (staff)', phone:'+237 6 70 11 32 88', pts:0, staff:true },
  ],
  crates: { out: 44, value: 8800 },
  staff: [
    { id:'u1', name:'Chantal Mbezele', first:'Chantal', role:'Owner',   init:'CM', pin:'1140' },
    { id:'u2', name:'Alain Tchouta',   first:'Alain',   role:'Cashier', init:'AT', pin:'4417' },
  ],
  /* the platform list, plus the card a co-op issues its members */
  tenders: window.KZ_TENDER.named({ gift: true }),
};
