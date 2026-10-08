import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {withAccent,validAppearance,parseAppearance,readableForeground,contrastRatio,paletteWarnings} from '../lib/user-appearance.ts';
import {normalizeProfilePhoto,MAX_PHOTO_BYTES} from '../lib/profile-photo.ts';
test('palettes reject CSS injection, unexpected keys, arrays and incomplete hex values',()=>{
 for(const colors of [{light:{bg:'url(x)'}},{light:{bg:'#fff'}},{light:{unknown:'#112233'}},{system:{}},{dark:null},[],{light:[]}]) {
  assert.equal(validAppearance({mode:'light',accent:'blue',colors}),false);
  assert.equal(parseAppearance({colors}).colors,undefined);
 }
 const value={mode:'dark',accent:'green',colors:{light:{border:'#ABCDEF'},dark:{selection:'#112233'}}};
 assert.equal(validAppearance(value),true);assert.deepEqual(parseAppearance(value),value);
 assert.deepEqual(parseAppearance({mode:'dark',accent:'green'}),{mode:'dark',accent:'green'});
});
test('readability warnings detect custom collisions and preserve user choices',()=>{
 assert.equal(contrastRatio('#000000','#ffffff'),21);
 assert.equal(readableForeground('#000000'),'#ffffff');
 assert.ok(paletteWarnings({mode:'light',accent:'blue',colors:{light:{text:'#ffffff',bg:'#ffffff'}}},'light').includes('Texto principal / Fondo de la plataforma'));
});
test('profile photo normalization decodes, crops, strips metadata and caps dimensions',async()=>{
 const input=await sharp({create:{width:700,height:600,channels:3,background:'#112233'}}).jpeg().withMetadata().toBuffer();
 const output=await normalizeProfilePhoto(input,'image/jpeg');const meta=await sharp(output).metadata();
 assert.equal(meta.format,'webp');assert.equal(meta.width,512);assert.equal(meta.height,512);assert.equal(meta.exif,undefined);
 await assert.rejects(()=>normalizeProfilePhoto(Buffer.from('<svg></svg>'),'image/svg+xml'));
 await assert.rejects(()=>normalizeProfilePhoto(Buffer.from('not a picture'),'image/png'));
 await assert.rejects(()=>normalizeProfilePhoto(Buffer.alloc(MAX_PHOTO_BYTES+1),'image/jpeg'));
});

test('preset accent replaces custom button colors while retaining independent borders and selection',()=>{
 const preference={mode:'light',accent:'blue',colors:{light:{primary:'#000000',hover:'#112233','button-text':'#ffffff',border:'#445566',selection:'#abcdef'}}};
 assert.deepEqual(withAccent(preference,'green'),{mode:'light',accent:'green',colors:{light:{border:'#445566',selection:'#abcdef'}}});
 assert.deepEqual(withAccent({mode:'dark',accent:'blue'},'purple'),{mode:'dark',accent:'purple'});
});
