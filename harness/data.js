// Sample events for Nov 3–23 2026 (made-up family schedule); replace with your own to test
const T = (d, s, e, summary) => ({ summary, start: { dateTime: `2026-${d}T${s}:00-05:00` }, end: { dateTime: `2026-${d}T${e}:00-05:00` } });
const A = (d, e, summary) => ({ summary, start: { date: `2026-${d}` }, end: { date: `2026-${e}` } });
module.exports.events = {
  'calendar.family': [
    T('11-04', '15:00', '16:00', 'Contractor estimate'), T('11-04', '17:15', '18:45', 'Gymnastics (Kid A)'),
    T('11-04', '18:00', '19:00', 'Scout meeting (Kid A & Parent)'), T('11-04', '19:00', '19:30', 'Take out trash'),
    T('11-05', '15:15', '16:40', 'Language club (Kid A)'), T('11-05', '19:00', '19:30', 'Take out recycling'),
    T('11-06', '16:30', '18:30', 'Gymnastics (Kid A)'),
    T('11-07', '08:30', '11:00', 'Nature hike (Kid B)'), T('11-07', '10:00', '12:30', 'Gymnastics (Kid A)'),
    T('11-07', '11:00', '15:00', 'School fair'), T('11-07', '13:45', '15:45', 'Birthday party (Kid A)'),
    T('11-07', '15:00', '17:00', 'Birthday party (Kids C)'),
    T('11-08', '10:00', '11:00', 'Brunch'), T('11-08', '14:00', '15:00', 'Farm visit'), T('11-08', '14:00', '18:00', 'Festival'),
    T('11-09', '15:15', '16:40', 'Language club (Kid A)'), T('11-09', '15:45', '16:25', 'Dance class (Kids C)'),
    T('11-10', '08:30', '09:30', 'Appointment (Parent)'),
    T('11-11', '17:15', '18:45', 'Gymnastics (Kid A)'), T('11-11', '19:00', '20:00', 'Take out trash'), T('11-11', '19:00', '20:00', 'Info session (Kid B)'),
    T('11-12', '15:15', '16:40', 'Language club (Kid A)'), T('11-12', '19:00', '20:00', 'Scout meeting'), T('11-12', '19:00', '20:00', 'Bake night'),
    T('11-13', '16:30', '18:30', 'Gymnastics (Kid A)'),
    T('11-14', '09:00', '12:00', 'Auction (Parent)'), T('11-14', '10:00', '12:30', 'Gymnastics (Kid A)'),
    T('11-15', '15:00', '17:00', 'Au pair dinner'),
    T('11-16', '15:15', '16:40', 'Language club (Kid A)'), T('11-16', '15:45', '16:25', 'Dance class (Kids C)'),
  ],
  'calendar.school': [
    A('11-04', '11-05', 'Wednesday Clubs (early dismissal 1:15)'), A('11-07', '11-09', 'School Fall Family Photo Fundraiser'),
    T('11-07', '08:30', '12:00', 'School Family Portrait Fundraiser'), T('11-08', '08:30', '12:00', 'School Family Portrait Fundraiser'),
    T('11-09', '19:00', '20:00', 'PTA Meeting'), A('11-11', '11-12', "No School - Veteran's Day"),
    A('11-18', '11-19', 'Wednesday Clubs (early dismissal 1:15)'),
  ],
  'calendar.scouts': [T('11-04', '18:00', '19:00', 'Troop Meeting'), T('11-14', '14:30', '16:30', 'Tea party')],
  'calendar.holidays_in_united_states': [A('11-03', '11-04', 'Election Day'), A('11-11', '11-12', 'Veterans Day')],
};
module.exports.daily = [
  ['11-03', 'partlycloudy', 74, 59, 0], ['11-04', 'partlycloudy', 77, 54, 0], ['11-05', 'rainy', 76, 64, 0.24], ['11-06', 'rainy', 69, 64, 0.86],
  ['11-07', 'sunny', 71, 57, 0], ['11-08', 'sunny', 62, 46, 0], ['11-09', 'sunny', 60, 42, 0], ['11-10', 'partlycloudy', 63, 44, 0],
  ['11-11', 'cloudy', 58, 45, 0.1], ['11-12', 'sunny', 61, 40, 0], ['11-13', 'rainy', 55, 43, 0.4], ['11-14', 'sunny', 59, 38, 0],
  ['11-15', 'partlycloudy', 62, 41, 0], ['11-16', 'sunny', 64, 44, 0], ['11-17', 'sunny', 65, 45, 0], ['11-18', 'rainy', 60, 50, 0.3],
].map(([d, condition, temperature, templow, precipitation]) => ({ datetime: `2026-${d}T12:00:00-05:00`, condition, temperature, templow, precipitation, uv_index: 3 }));
// NWS-style precip chances by day
module.exports.pop = { '11-04': 17, '11-05': 59, '11-06': 69, '11-07': 15, '11-08': 22, '11-09': 22, '11-11': 30, '11-13': 60, '11-18': 40 };
// Fake availability-only work calendar (no titles), typical 50-min sessions
const S = (d, s, e) => ({ summary: '', start: { dateTime: `2026-${d}T${s}:00-05:00` }, end: { dateTime: `2026-${d}T${e}:00-05:00` } });
module.exports.events['calendar.work_availability'] = [
  ...['09:00','10:00','11:00','13:00','14:00'].map(t => S('11-04', t, t.replace(':00', ':50'))),
  ...['08:00','09:00','12:00','13:00','14:00','15:00'].map(t => S('11-09', t, t.replace(':00', ':50'))),
  S('11-11', '10:00', '10:50'), S('11-11', '11:00', '11:50'),
];
module.exports.events['calendar.work_availability'] = [
  ['11-03','10:00','11:00'],['11-04','20:00','21:00'],['11-09','09:00','10:00'],['11-09','15:45','16:25'],['11-09','18:00','19:00'],
  ['11-10','10:00','11:00'],['11-11','14:00','15:00'],['11-12','19:30','21:00'],
].map(([d, s, e]) => S(d, s, e));
