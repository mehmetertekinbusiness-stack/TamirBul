import { Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { File as FSFile } from 'expo-file-system';
import { supabase } from '../supabase';

// ─── Greeting ─────────────────────────────────────────────────────────────────
export function greeting() {
  const h = new Date().getHours();
  if (h<12) return 'Günaydın';
  if (h<18) return 'İyi günler';
  return 'İyi akşamlar';
}

// ─── Today ISO ────────────────────────────────────────────────────────────────
export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

// ─── Format Date ──────────────────────────────────────────────────────────────
export function fmtDate(t: string | null | undefined) {
  if (!t) return '';
  const [y,m,d] = t.split('-');
  return `${d}.${m}.${y}`;
}

// ─── Format Time ──────────────────────────────────────────────────────────────
export function fmtTime(t: string | null | undefined) {
  return (t || '').slice(0, 5);
}

// ─── Next 7 Days ──────────────────────────────────────────────────────────────
export function next7Days(working_hours: any) {
  const G=['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'];
  const A=['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
  return Array.from({length:7},(_,i) => {
    const d = new Date(); d.setDate(d.getDate()+i);
    const key = String(d.getDay());
    const wh  = working_hours?.[key];
    return {
      tarih:  d.toISOString().split('T')[0],
      etiket: `${d.getDate()} ${A[d.getMonth()]}`,
      gun:    i===0?'Bugün':i===1?'Yarın':G[d.getDay()],
      closed: wh ? wh.closed : false,
      open:   wh?.open  || '09:00',
      close:  wh?.close || '20:00',
    };
  });
}

// ─── Make Slots ───────────────────────────────────────────────────────────────
export function makeSlots(open='09:00', close='20:00') {
  const slots=[]; let [sh,sd]=open.split(':').map(Number); const [ch,cm]=close.split(':').map(Number);
  const closeMin=ch*60+cm;
  while(sh*60+sd<closeMin){slots.push(`${String(sh).padStart(2,'0')}:${String(sd).padStart(2,'0')}`);sd+=30;if(sd>=60){sh++;sd-=60;}}
  return slots;
}

// ─── Is Slot Taken ────────────────────────────────────────────────────────────
export function isSlotTaken(slot: string, taken: string[], dur: number) {
  const [sh,sd]=slot.split(':').map(Number),sm=sh*60+sd;
  return taken.some((t: string)=>{const [th,td]=t.split(':').map(Number),tm=th*60+td;return sm>=tm&&sm<tm+dur;});
}

// ─── Is Open Now ──────────────────────────────────────────────────────────────
export function isOpenNow(wh: any) {
  if (!wh) return null;
  const now = new Date();
  const key = String(now.getDay());
  const day = wh[key];
  if (!day) return null;
  if (day.closed) return false;
  const [oh, om] = day.open.split(':').map(Number);
  const [ch, cm] = day.close.split(':').map(Number);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return nowMin >= oh * 60 + om && nowMin < ch * 60 + cm;
}

// ─── Default Filter ───────────────────────────────────────────────────────────
export function defaultFilter(gender: string) {
  if (gender==='kadin') return 'kuafor';
  if (gender==='erkek') return 'berber';
  return 'all';
}

// ─── Open Link ────────────────────────────────────────────────────────────────
export function openLink(url: string) {
  if (!url) return;
  const full = url.startsWith('http') ? url : `https://${url}`;
  Linking.openURL(full).catch(() => {});
}

// ─── Send Push Notification ───────────────────────────────────────────────────
export async function sendPushNotification(token: string, title: string, body: string, data: Record<string, any> = {}) {
  if (!token) return;
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({to: token, sound: 'default', title, body, data}),
  }).catch(() => {});
}

// ─── Upload Photo ─────────────────────────────────────────────────────────────
export async function uploadPhoto(uri: string, folder: string) {
  const byteArray = await new FSFile(uri).bytes();
  const filename = `${folder}/${Date.now()}.jpg`;
  const {data, error} = await supabase.storage
    .from('salon-photos')
    .upload(filename, byteArray, {contentType:'image/jpeg', upsert:true});
  if (error) throw error;
  const {data:{publicUrl}} = supabase.storage.from('salon-photos').getPublicUrl(data.path);
  return publicUrl;
}

// ─── Pick Image ───────────────────────────────────────────────────────────────
export async function pickImage(options: {crop?: boolean; aspect?: [number, number]}) {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw new Error('Galeri izni gerekli');
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: options.crop || false,
    aspect: options.aspect || [4,3],
    quality: 0.8,
  });
  if (result.canceled) return null;
  return result.assets[0].uri;
}
