import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';

interface CalendarSyncParams {
  peptideName: string;
  targetDose: number;
  unit: string;
  activeDays: string[];
  injectionTime: string;
  frequencyLabel: string;
  volumeMl?: string;
  dialClicks?: number;
}

const DAY_CODE_MAP: Record<string, string> = {
  Sen: 'MO',
  Sel: 'TU',
  Rab: 'WE',
  Kam: 'TH',
  Jum: 'FR',
  Sab: 'SA',
  Min: 'SU',
};

export async function exportToAppleCalendar(params: CalendarSyncParams) {
  try {
    const {
      peptideName,
      targetDose,
      unit,
      activeDays,
      injectionTime,
      frequencyLabel,
      volumeMl,
      dialClicks,
    } = params;

    // Parsing jam dan menit dari input (misal: "08:00")
    const timeParts = (injectionTime || '08:00').split(/[:.]/);
    const hours = timeParts[0] ? timeParts[0].padStart(2, '0') : '08';
    const minutes = timeParts[1] ? timeParts[1].padStart(2, '0') : '00';

    // Mendapatkan tanggal hari ini sebagai titik awal jadwal
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    // Format standar iCalendar: YYYYMMDDTHHMMSS
    const dtStart = `${year}${month}${day}T${hours}${minutes}00`;
    
    // Generate UTC time untuk DTSTAMP (Wajib untuk validasi ketat Apple Calendar)
    const utcNow = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
    const utcYear = utcNow.getFullYear();
    const utcMonth = String(utcNow.getMonth() + 1).padStart(2, '0');
    const utcDay = String(utcNow.getDate()).padStart(2, '0');
    const utcHours = String(utcNow.getHours()).padStart(2, '0');
    const utcMinutes = String(utcNow.getMinutes()).padStart(2, '0');
    const dtStamp = `${utcYear}${utcMonth}${utcDay}T${utcHours}${utcMinutes}00Z`;

    // Penyusunan Recurrence Rule (RRULE) berdasarkan hari aktif
    const mappedDays = (activeDays || ['Sen']).map((d) => DAY_CODE_MAP[d]).filter(Boolean);
    let rruleString = 'FREQ=WEEKLY';
    if (mappedDays.length > 0) {
      rruleString = `FREQ=WEEKLY;BYDAY=${mappedDays.join(',')}`;
    }

    const eventUid = `biostack-${peptideName.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now()}@biostack.pro`;
    const summary = `BioStack: Injeksi ${peptideName} (${targetDose} ${unit})`;
    const description = `Protokol Injeksi Peptida BioStack PRO\\nSenyawa: ${peptideName}\\nTarget Dosis: ${targetDose} ${unit}\\nVolume Spuit: ${volumeMl || '0.200'} mL\\nDial Pen: ${dialClicks || 20} Klik\\nFrekuensi: ${frequencyLabel}\\n\\nRotasikan lokasi subkutan minimal 2.5 cm dari titik sebelumnya.`;

    // Merakit format berkas iCalendar (.ics)
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//BioStack PRO//Peptide Protocol//ID',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${eventUid}`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART;TZID=Asia/Jakarta:${dtStart}`, // Paksa menggunakan Timezone Lokal
      `RRULE:${rruleString}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:Waktunya Injeksi ${peptideName}`,
      'TRIGGER:-PT15M', // Alarm 15 menit sebelumnya
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    // Membersihkan nama file & menentukan lokasi penyimpanan sementara
    const cleanFileName = peptideName.replace(/[^a-zA-Z0-9]/g, '_');
    const fileUri = `${FileSystem.documentDirectory}${cleanFileName}_Protocol.ics`;

    // Menyimpan berkas ke dalam memori aplikasi
    await FileSystem.writeAsStringAsync(fileUri, icsContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // Menjalankan fitur Share khusus iOS agar mendeteksi berkas sebagai Jadwal Kalender
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/calendar',
        dialogTitle: `Tambahkan ${peptideName} ke Kalender`,
        UTI: 'com.apple.ical.ics', // Trigger khusus untuk Apple Calendar
      });
    } else {
      Alert.alert('Gagal', 'Fitur berbagi sistem tidak tersedia pada perangkat ini.');
    }
  } catch (error) {
    Alert.alert('Gagal mengekspor jadwal', 'Pastikan izin akses file / kalender sistem Anda tidak dibatasi.');
  }
}
