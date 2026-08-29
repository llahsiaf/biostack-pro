export interface InjectionSite {
  id: string;
  code: string;
  name: string;
  cx: number;
  cy: number;
}

export const INJECTION_SITES: InjectionSite[] = [
  // Perut (Torso) - 4 kuadran
  { id: 'KA', code: 'KA', name: 'Kanan Atas', cx: 124, cy: 57 },
  { id: 'KiA', code: 'KiA', name: 'Kiri Atas', cx: 196, cy: 57 },
  { id: 'KB', code: 'KB', name: 'Kanan Bawah', cx: 124, cy: 113 },
  { id: 'KiB', code: 'KiB', name: 'Kiri Bawah', cx: 196, cy: 113 },

  // Paha (Thighs)
  { id: 'PKi', code: 'PKi', name: 'Paha Kiri', cx: 100, cy: 200 },
  { id: 'PKn', code: 'PKn', name: 'Paha Kanan', cx: 220, cy: 200 },

  // Lengan (Arms)
  { id: 'LKi', code: 'LKi', name: 'Lengan Kiri', cx: 60, cy: 100 },
  { id: 'LKn', code: 'LKn', name: 'Lengan Kanan', cx: 260, cy: 100 },

  // Bokong (Glutes)
  { id: 'BKi', code: 'BKi', name: 'Bokong Kiri', cx: 110, cy: 260 },
  { id: 'BKn', code: 'BKn', name: 'Bokong Kanan', cx: 210, cy: 260 },
];
