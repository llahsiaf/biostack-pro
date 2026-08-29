import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert, Linking, Platform } from 'react-native';

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

    // Parsing jam dan menit (misal: "08:00" -> hour: 08, min: 00)
    const timeParts = (injectionTime || '08:00').split(/[:.]/);
    const hours = timeParts[0] ? timeParts[0].padStart(2, '0') : '08';
    const minutes = timeParts[1] ? timeParts[1].padStart(2, '0') : '00';

    // Format tanggal mulai iCalendar (YYYYMMDDTHHMMSS)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dtStart = `${year}${month}${day}T${hours}${minutes}00`;

    // Penyusunan Recurrence Rule (RRULE)
    const mappedDays = (activeDays || ['Sen']).map((d) => DAY_CODE_MAP[d]).filter(Boolean);
    let rruleString = 'FREQ=WEEKLY';
    if (mappedDays.length > 0) {
      rruleString = `FREQ=WEEKLY;BYDAY=${mappedDays.join(',')}`;
    }

    const eventUid = `biostack-${peptideName.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now()}@biostack.pro`;
    const summary = `BioStack PRO: Injeksi ${peptideName} (${targetDose} ${unit})`;
    const description = `Protokol Injeksi Peptida BioStack PRO\\nSenyawa: ${peptideName}\\nTarget Dosis: ${targetDose} ${unit}\\nVolume: ${volumeMl || '0.200'} mL\\nDial Pen: ${dialClicks || 20} Klik\\nFrekuensi: ${frequencyLabel}\\nCatatan: Rotasikan lokasi subkutan minimal 2.5 cm dari titik sebelumnya.`;

    // Format Berkas iCalendar Standar RFC 5545
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//BioStack PRO//Peptide Protocol Generator//ID',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${eventUid}`,
      `DTSTAMP:${dtStart}Z`,
      `DTSTART:${dtStart}`,
      `RRULE:${rruleString}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:Waktunya Injeksi ${peptideName}`,
      'TRIGGER:-PT0M',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    // Simpan berkas ke direktori dokumen lokal
    const cleanFileName = peptideName.replace(/[^a-zA-Z0-9]/g, '_');
    const fileUri = `${FileSystem.documentDirectory}Jadwal_${cleanFileName}.ics`;

    await FileSystem.writeAsStringAsync(fileUri, icsContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // Buka langsung aplikasi Kalender iOS
    if (Platform.OS === 'ios') {
      const canOpen = await Linking.canOpenURL(fileUri);
      if (canOpen) {
        await Linking.openURL(fileUri);
        return;
      }
    }

    // Fallback native sharing jika Linking lokal dibatasi
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/calendar',
        dialogTitle: `Tambahkan Jadwal ${peptideName} ke Kalender`,
        UTI: 'com.apple.ical.ics',
      });
    } else {
      Alert.alert('Info', 'Berkas kalender berhasil dibuat di memori perangkat.');
    }
  } catch (error) {
    Alert.alert('Gagal', 'Terjadi kesalahan saat mengekspor jadwal kalender.');
  }
}
