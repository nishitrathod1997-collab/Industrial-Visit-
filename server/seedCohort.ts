import {
  User,
  StudentProfile,
  Registration,
  WaitlistEntry,
  BoardingPass,
  AttendanceRecord,
  Certificate,
  AppNotification,
} from '../src/types';

// Master list of 65 realistic VIT engineering students
export const SEED_STUDENT_PROFILES: Array<{
  studentId: string;
  name: string;
  email: string;
  branch: string;
  year: number;
  semester: number;
  division: string;
  department: string;
  cgpa: number;
  phone: string;
  prn: string;
}> = [
  {
    studentId: '21BCE10482',
    name: 'Nishit Rathod',
    email: 'nishitrathod1997@gmail.com',
    branch: 'Computer Science & Engineering',
    year: 3,
    semester: 6,
    division: 'A',
    department: 'School of Computer Science & Engineering (SCOPE)',
    cgpa: 8.85,
    phone: '+91 98201 45678',
    prn: 'PRN202100482',
  },
  {
    studentId: '21BCE10214',
    name: 'Priya Sharma',
    email: 'priya.sharma@vit.edu.in',
    branch: 'Computer Science & Engineering',
    year: 3,
    semester: 6,
    division: 'A',
    department: 'School of Computer Science & Engineering (SCOPE)',
    cgpa: 9.12,
    phone: '+91 98450 12345',
    prn: 'PRN202100214',
  },
  {
    studentId: '21BEE10319',
    name: 'Rahul Verma',
    email: 'rahul.verma@vit.edu.in',
    branch: 'Electrical & Electronics Engineering',
    year: 3,
    semester: 6,
    division: 'B',
    department: 'School of Electrical Engineering (SELECT)',
    cgpa: 7.82,
    phone: '+91 98765 43210',
    prn: 'PRN202100319',
  },
  {
    studentId: '22BME10105',
    name: 'Ananya Iyer',
    email: 'ananya.iyer@vit.edu.in',
    branch: 'Mechanical Engineering',
    year: 2,
    semester: 4,
    division: 'A',
    department: 'School of Mechanical Engineering (SMEC)',
    cgpa: 8.45,
    phone: '+91 97654 32109',
    prn: 'PRN202200105',
  },
  {
    studentId: '21BIT10599',
    name: 'Rohan Kulkarni',
    email: 'rohan.kulkarni@vit.edu.in',
    branch: 'Information Technology',
    year: 3,
    semester: 6,
    division: 'C',
    department: 'School of Information Technology (SITE)',
    cgpa: 8.2,
    phone: '+91 96543 21098',
    prn: 'PRN202100599',
  },
  {
    studentId: '21BCE10001',
    name: 'Aarav Patel',
    email: 'aarav.patel@vit.edu.in',
    branch: 'Computer Science & Engineering',
    year: 3,
    semester: 6,
    division: 'A',
    department: 'School of Computer Science & Engineering (SCOPE)',
    cgpa: 8.65,
    phone: '+91 98111 22334',
    prn: 'PRN202100001',
  },
  {
    studentId: '21BCE10002',
    name: 'Sneha Deshmukh',
    email: 'sneha.deshmukh@vit.edu.in',
    branch: 'Computer Science & Engineering',
    year: 3,
    semester: 6,
    division: 'B',
    department: 'School of Computer Science & Engineering (SCOPE)',
    cgpa: 8.9,
    phone: '+91 98222 33445',
    prn: 'PRN202100002',
  },
  {
    studentId: '21BCE10003',
    name: 'Tanmay Joshi',
    email: 'tanmay.joshi@vit.edu.in',
    branch: 'Computer Science & Engineering',
    year: 3,
    semester: 6,
    division: 'A',
    department: 'School of Computer Science & Engineering (SCOPE)',
    cgpa: 8.4,
    phone: '+91 98333 44556',
    prn: 'PRN202100003',
  },
  {
    studentId: '21BCE10004',
    name: 'Divya Nair',
    email: 'divya.nair@vit.edu.in',
    branch: 'Computer Science & Engineering',
    year: 3,
    semester: 6,
    division: 'C',
    department: 'School of Computer Science & Engineering (SCOPE)',
    cgpa: 9.05,
    phone: '+91 98444 55667',
    prn: 'PRN202100004',
  },
  {
    studentId: '21BCE10005',
    name: 'Siddharth Menon',
    email: 'siddharth.menon@vit.edu.in',
    branch: 'Computer Science & Engineering',
    year: 3,
    semester: 6,
    division: 'B',
    department: 'School of Computer Science & Engineering (SCOPE)',
    cgpa: 8.15,
    phone: '+91 98555 66778',
    prn: 'PRN202100005',
  },
  {
    studentId: '21BCE10006',
    name: 'Pooja Hegde',
    email: 'pooja.hegde@vit.edu.in',
    branch: 'Computer Science & Engineering',
    year: 3,
    semester: 6,
    division: 'A',
    department: 'School of Computer Science & Engineering (SCOPE)',
    cgpa: 8.75,
    phone: '+91 98666 77889',
    prn: 'PRN202100006',
  },
  {
    studentId: '21BCE10007',
    name: 'Aditya Rao',
    email: 'aditya.rao@vit.edu.in',
    branch: 'Computer Science & Engineering',
    year: 3,
    semester: 6,
    division: 'C',
    department: 'School of Computer Science & Engineering (SCOPE)',
    cgpa: 8.35,
    phone: '+91 98777 88990',
    prn: 'PRN202100007',
  },
  {
    studentId: '21BCE10008',
    name: 'Ritu Singhania',
    email: 'ritu.singhania@vit.edu.in',
    branch: 'Computer Science & Engineering',
    year: 3,
    semester: 6,
    division: 'B',
    department: 'School of Computer Science & Engineering (SCOPE)',
    cgpa: 9.3,
    phone: '+91 98888 99001',
    prn: 'PRN202100008',
  },
  {
    studentId: '21BCE10009',
    name: 'Varun Kapoor',
    email: 'varun.kapoor@vit.edu.in',
    branch: 'Computer Science & Engineering',
    year: 3,
    semester: 6,
    division: 'A',
    department: 'School of Computer Science & Engineering (SCOPE)',
    cgpa: 7.95,
    phone: '+91 98999 00112',
    prn: 'PRN202100009',
  },
  {
    studentId: '21BCE10010',
    name: 'Shreya Ghosh',
    email: 'shreya.ghosh@vit.edu.in',
    branch: 'Computer Science & Engineering',
    year: 3,
    semester: 6,
    division: 'C',
    department: 'School of Computer Science & Engineering (SCOPE)',
    cgpa: 8.8,
    phone: '+91 99000 11223',
    prn: 'PRN202100010',
  },
  {
    studentId: '21BCE10011',
    name: 'Manav Malhotra',
    email: 'manav.malhotra@vit.edu.in',
    branch: 'Computer Science & Engineering',
    year: 3,
    semester: 6,
    division: 'B',
    department: 'School of Computer Science & Engineering (SCOPE)',
    cgpa: 8.5,
    phone: '+91 99111 22334',
    prn: 'PRN202100011',
  },
  {
    studentId: '21BCE10012',
    name: 'Ishaan Roy',
    email: 'ishaan.roy@vit.edu.in',
    branch: 'Computer Science & Engineering',
    year: 3,
    semester: 6,
    division: 'A',
    department: 'School of Computer Science & Engineering (SCOPE)',
    cgpa: 8.25,
    phone: '+91 99222 33445',
    prn: 'PRN202100012',
  },
  {
    studentId: '21BCE10013',
    name: 'Kavya Pillai',
    email: 'kavya.pillai@vit.edu.in',
    branch: 'Computer Science & Engineering',
    year: 3,
    semester: 6,
    division: 'B',
    department: 'School of Computer Science & Engineering (SCOPE)',
    cgpa: 9.1,
    phone: '+91 99333 44556',
    prn: 'PRN202100013',
  },
  {
    studentId: '21BCE10014',
    name: 'Harshvardhan Jain',
    email: 'harshvardhan.jain@vit.edu.in',
    branch: 'Computer Science & Engineering',
    year: 3,
    semester: 6,
    division: 'C',
    department: 'School of Computer Science & Engineering (SCOPE)',
    cgpa: 8.6,
    phone: '+91 99444 55667',
    prn: 'PRN202100014',
  },
  {
    studentId: '21BCE10015',
    name: 'Meera Nambiar',
    email: 'meera.nambiar@vit.edu.in',
    branch: 'Computer Science & Engineering',
    year: 3,
    semester: 6,
    division: 'A',
    department: 'School of Computer Science & Engineering (SCOPE)',
    cgpa: 8.95,
    phone: '+91 99555 66778',
    prn: 'PRN202100015',
  },
  {
    studentId: '21BCE10016',
    name: 'Nikhil Chawla',
    email: 'nikhil.chawla@vit.edu.in',
    branch: 'Computer Science & Engineering',
    year: 3,
    semester: 6,
    division: 'B',
    department: 'School of Computer Science & Engineering (SCOPE)',
    cgpa: 8.1,
    phone: '+91 99666 77889',
    prn: 'PRN202100016',
  },
  {
    studentId: '21BCE10017',
    name: 'Payal Bhatia',
    email: 'payal.bhatia@vit.edu.in',
    branch: 'Computer Science & Engineering',
    year: 3,
    semester: 6,
    division: 'C',
    department: 'School of Computer Science & Engineering (SCOPE)',
    cgpa: 8.4,
    phone: '+91 99777 88990',
    prn: 'PRN202100017',
  },
  {
    studentId: '21BCE10018',
    name: 'Abhishek Saxena',
    email: 'abhishek.saxena@vit.edu.in',
    branch: 'Computer Science & Engineering',
    year: 3,
    semester: 6,
    division: 'A',
    department: 'School of Computer Science & Engineering (SCOPE)',
    cgpa: 8.7,
    phone: '+91 99888 99001',
    prn: 'PRN202100018',
  },
  {
    studentId: '21BCE10019',
    name: 'Neha Agarwal',
    email: 'neha.agarwal@vit.edu.in',
    branch: 'Computer Science & Engineering',
    year: 3,
    semester: 6,
    division: 'B',
    department: 'School of Computer Science & Engineering (SCOPE)',
    cgpa: 9.15,
    phone: '+91 99999 00112',
    prn: 'PRN202100019',
  },
  {
    studentId: '21BCE10020',
    name: 'Karan Mehra',
    email: 'karan.mehra@vit.edu.in',
    branch: 'Computer Science & Engineering',
    year: 3,
    semester: 6,
    division: 'C',
    department: 'School of Computer Science & Engineering (SCOPE)',
    cgpa: 8.3,
    phone: '+91 97000 11223',
    prn: 'PRN202100020',
  },
  {
    studentId: '21BCE10021',
    name: 'Deepika Sen',
    email: 'deepika.sen@vit.edu.in',
    branch: 'Computer Science & Engineering',
    year: 3,
    semester: 6,
    division: 'A',
    department: 'School of Computer Science & Engineering (SCOPE)',
    cgpa: 8.85,
    phone: '+91 97111 22334',
    prn: 'PRN202100021',
  },
  {
    studentId: '21BCE10022',
    name: 'Vikram Sethi',
    email: 'vikram.sethi@vit.edu.in',
    branch: 'Computer Science & Engineering',
    year: 3,
    semester: 6,
    division: 'B',
    department: 'School of Computer Science & Engineering (SCOPE)',
    cgpa: 8.05,
    phone: '+91 97222 33445',
    prn: 'PRN202100022',
  },
  {
    studentId: '21BEC10023',
    name: 'Tarun Reddy',
    email: 'tarun.reddy@vit.edu.in',
    branch: 'Electronics & Communication Engineering',
    year: 3,
    semester: 6,
    division: 'A',
    department: 'School of Electronics Engineering (SENSE)',
    cgpa: 8.55,
    phone: '+91 97333 44556',
    prn: 'PRN202100023',
  },
  {
    studentId: '21BEC10024',
    name: 'Ankita Mishra',
    email: 'ankita.mishra@vit.edu.in',
    branch: 'Electronics & Communication Engineering',
    year: 3,
    semester: 6,
    division: 'B',
    department: 'School of Electronics Engineering (SENSE)',
    cgpa: 8.92,
    phone: '+91 97444 55667',
    prn: 'PRN202100024',
  },
  {
    studentId: '21BEC10025',
    name: 'Saurabh Tiwari',
    email: 'saurabh.tiwari@vit.edu.in',
    branch: 'Electronics & Communication Engineering',
    year: 3,
    semester: 6,
    division: 'A',
    department: 'School of Electronics Engineering (SENSE)',
    cgpa: 8.22,
    phone: '+91 97555 66778',
    prn: 'PRN202100025',
  },
  {
    studentId: '21BME10026',
    name: 'Sameer Kulkarni',
    email: 'sameer.k@vit.edu.in',
    branch: 'Mechanical Engineering',
    year: 3,
    semester: 6,
    division: 'A',
    department: 'School of Mechanical Engineering (SMEC)',
    cgpa: 8.18,
    phone: '+91 97666 77889',
    prn: 'PRN202100026',
  },
  {
    studentId: '21BME10027',
    name: 'Gaurav Bhatt',
    email: 'gaurav.bhatt@vit.edu.in',
    branch: 'Mechanical Engineering',
    year: 3,
    semester: 6,
    division: 'B',
    department: 'School of Mechanical Engineering (SMEC)',
    cgpa: 8.42,
    phone: '+91 97777 88990',
    prn: 'PRN202100027',
  },
  {
    studentId: '21BME10028',
    name: 'Mansi Gupta',
    email: 'mansi.gupta@vit.edu.in',
    branch: 'Mechanical Engineering',
    year: 3,
    semester: 6,
    division: 'A',
    department: 'School of Mechanical Engineering (SMEC)',
    cgpa: 8.68,
    phone: '+91 97888 99001',
    prn: 'PRN202100028',
  },
  {
    studentId: '21BME10029',
    name: 'Chetan Bhagat',
    email: 'chetan.bhagat@vit.edu.in',
    branch: 'Mechanical Engineering',
    year: 3,
    semester: 6,
    division: 'B',
    department: 'School of Mechanical Engineering (SMEC)',
    cgpa: 7.92,
    phone: '+91 97999 00112',
    prn: 'PRN202100029',
  },
  {
    studentId: '22BME10030',
    name: 'Rohit Sarma',
    email: 'rohit.sarma@vit.edu.in',
    branch: 'Mechanical Engineering',
    year: 2,
    semester: 4,
    division: 'A',
    department: 'School of Mechanical Engineering (SMEC)',
    cgpa: 8.35,
    phone: '+91 96000 11223',
    prn: 'PRN202200030',
  },
  {
    studentId: '21BEE10031',
    name: 'Swati Kulkarni',
    email: 'swati.k@vit.edu.in',
    branch: 'Electrical & Electronics Engineering',
    year: 3,
    semester: 6,
    division: 'A',
    department: 'School of Electrical Engineering (SELECT)',
    cgpa: 8.78,
    phone: '+91 96111 22334',
    prn: 'PRN202100031',
  },
  {
    studentId: '21BEE10032',
    name: 'Arjun Namboodiri',
    email: 'arjun.n@vit.edu.in',
    branch: 'Electrical & Electronics Engineering',
    year: 3,
    semester: 6,
    division: 'B',
    department: 'School of Electrical Engineering (SELECT)',
    cgpa: 8.12,
    phone: '+91 96222 33445',
    prn: 'PRN202100032',
  },
  {
    studentId: '22BEE10033',
    name: 'Harish Raj',
    email: 'harish.raj@vit.edu.in',
    branch: 'Electrical & Electronics Engineering',
    year: 2,
    semester: 4,
    division: 'A',
    department: 'School of Electrical Engineering (SELECT)',
    cgpa: 7.95,
    phone: '+91 96333 44556',
    prn: 'PRN202200033',
  },
  {
    studentId: '21BEC10034',
    name: 'Vinay Madhav',
    email: 'vinay.m@vit.edu.in',
    branch: 'Electronics & Communication Engineering',
    year: 3,
    semester: 6,
    division: 'A',
    department: 'School of Electronics Engineering (SENSE)',
    cgpa: 8.45,
    phone: '+91 96444 55667',
    prn: 'PRN202100034',
  },
  {
    studentId: '21BEC10035',
    name: 'Ritika Shenoy',
    email: 'ritika.s@vit.edu.in',
    branch: 'Electronics & Communication Engineering',
    year: 3,
    semester: 6,
    division: 'B',
    department: 'School of Electronics Engineering (SENSE)',
    cgpa: 9.02,
    phone: '+91 96555 66778',
    prn: 'PRN202100035',
  },
  {
    studentId: '21BIT10036',
    name: 'Neeraj Verma',
    email: 'neeraj.v@vit.edu.in',
    branch: 'Information Technology',
    year: 3,
    semester: 6,
    division: 'A',
    department: 'School of Information Technology (SITE)',
    cgpa: 8.62,
    phone: '+91 96666 77889',
    prn: 'PRN202100036',
  },
  {
    studentId: '21BIT10037',
    name: 'Shweta Singh',
    email: 'shweta.s@vit.edu.in',
    branch: 'Information Technology',
    year: 3,
    semester: 6,
    division: 'B',
    department: 'School of Information Technology (SITE)',
    cgpa: 8.84,
    phone: '+91 96777 88990',
    prn: 'PRN202100037',
  },
  {
    studentId: '21BIT10038',
    name: 'Pranav Joshi',
    email: 'pranav.j@vit.edu.in',
    branch: 'Information Technology',
    year: 3,
    semester: 6,
    division: 'C',
    department: 'School of Information Technology (SITE)',
    cgpa: 8.14,
    phone: '+91 96888 99001',
    prn: 'PRN202100038',
  },
  {
    studentId: '21BCL10039',
    name: 'Karthik Ramaswamy',
    email: 'karthik.r@vit.edu.in',
    branch: 'Civil Engineering',
    year: 3,
    semester: 6,
    division: 'A',
    department: 'School of Civil Engineering (SCE)',
    cgpa: 8.25,
    phone: '+91 96999 00112',
    prn: 'PRN202100039',
  },
  {
    studentId: '21BCL10040',
    name: 'Bhavna Dave',
    email: 'bhavna.d@vit.edu.in',
    branch: 'Civil Engineering',
    year: 3,
    semester: 6,
    division: 'B',
    department: 'School of Civil Engineering (SCE)',
    cgpa: 8.65,
    phone: '+91 95000 11223',
    prn: 'PRN202100040',
  },
  {
    studentId: '22BCL10041',
    name: 'Prateek Sethi',
    email: 'prateek.s@vit.edu.in',
    branch: 'Civil Engineering',
    year: 2,
    semester: 4,
    division: 'A',
    department: 'School of Civil Engineering (SCE)',
    cgpa: 7.88,
    phone: '+91 95111 22334',
    prn: 'PRN202200041',
  },
  {
    studentId: '21BCL10042',
    name: 'Sanjana Hegde',
    email: 'sanjana.h@vit.edu.in',
    branch: 'Civil Engineering',
    year: 3,
    semester: 6,
    division: 'B',
    department: 'School of Civil Engineering (SCE)',
    cgpa: 8.45,
    phone: '+91 95222 33445',
    prn: 'PRN202100042',
  },
  {
    studentId: '21BBM10043',
    name: 'Drishya Nair',
    email: 'drishya.n@vit.edu.in',
    branch: 'Biomedical Engineering',
    year: 3,
    semester: 6,
    division: 'A',
    department: 'School of Bio Sciences & Technology (SBST)',
    cgpa: 8.92,
    phone: '+91 95333 44556',
    prn: 'PRN202100043',
  },
  {
    studentId: '21BBM10044',
    name: 'Alok Pandey',
    email: 'alok.p@vit.edu.in',
    branch: 'Biomedical Engineering',
    year: 3,
    semester: 6,
    division: 'B',
    department: 'School of Bio Sciences & Technology (SBST)',
    cgpa: 8.15,
    phone: '+91 95444 55667',
    prn: 'PRN202100044',
  },
  {
    studentId: '22BBM10045',
    name: 'Vaishnavi Iyer',
    email: 'vaishnavi.i@vit.edu.in',
    branch: 'Biomedical Engineering',
    year: 2,
    semester: 4,
    division: 'A',
    department: 'School of Bio Sciences & Technology (SBST)',
    cgpa: 8.72,
    phone: '+91 95555 66778',
    prn: 'PRN202200045',
  },
  {
    studentId: '21BBM10046',
    name: 'Mihir Desai',
    email: 'mihir.d@vit.edu.in',
    branch: 'Biomedical Engineering',
    year: 3,
    semester: 6,
    division: 'B',
    department: 'School of Bio Sciences & Technology (SBST)',
    cgpa: 8.38,
    phone: '+91 95666 77889',
    prn: 'PRN202100046',
  },
  {
    studentId: '21BCE10047',
    name: 'Lavanya Sridhar',
    email: 'lavanya.s@vit.edu.in',
    branch: 'Computer Science & Engineering',
    year: 3,
    semester: 6,
    division: 'A',
    department: 'School of Computer Science & Engineering (SCOPE)',
    cgpa: 8.88,
    phone: '+91 95777 88990',
    prn: 'PRN202100047',
  },
  {
    studentId: '21BCE10048',
    name: 'Yash Vardhan',
    email: 'yash.v@vit.edu.in',
    branch: 'Computer Science & Engineering',
    year: 3,
    semester: 6,
    division: 'B',
    department: 'School of Computer Science & Engineering (SCOPE)',
    cgpa: 8.27,
    phone: '+91 95888 99001',
    prn: 'PRN202100048',
  },
  {
    studentId: '21BCE10049',
    name: 'Simran Walia',
    email: 'simran.w@vit.edu.in',
    branch: 'Computer Science & Engineering',
    year: 3,
    semester: 6,
    division: 'C',
    department: 'School of Computer Science & Engineering (SCOPE)',
    cgpa: 8.74,
    phone: '+91 95999 00112',
    prn: 'PRN202100049',
  },
  {
    studentId: '21BCE10050',
    name: 'Kunal Singhal',
    email: 'kunal.s@vit.edu.in',
    branch: 'Computer Science & Engineering',
    year: 3,
    semester: 6,
    division: 'A',
    department: 'School of Computer Science & Engineering (SCOPE)',
    cgpa: 8.39,
    phone: '+91 94000 11223',
    prn: 'PRN202100050',
  },
  {
    studentId: '21BCE10051',
    name: 'Shruti Bajpai',
    email: 'shruti.b@vit.edu.in',
    branch: 'Computer Science & Engineering',
    year: 3,
    semester: 6,
    division: 'B',
    department: 'School of Computer Science & Engineering (SCOPE)',
    cgpa: 8.96,
    phone: '+91 94111 22334',
    prn: 'PRN202100051',
  },
  {
    studentId: '21BCE10052',
    name: 'Devendra Rathore',
    email: 'devendra.r@vit.edu.in',
    branch: 'Computer Science & Engineering',
    year: 3,
    semester: 6,
    division: 'C',
    department: 'School of Computer Science & Engineering (SCOPE)',
    cgpa: 8.19,
    phone: '+91 94222 33445',
    prn: 'PRN202100052',
  },
  {
    studentId: '21BCE10053',
    name: 'Akanksha Somani',
    email: 'akanksha.s@vit.edu.in',
    branch: 'Computer Science & Engineering',
    year: 3,
    semester: 6,
    division: 'A',
    department: 'School of Computer Science & Engineering (SCOPE)',
    cgpa: 9.08,
    phone: '+91 94333 44556',
    prn: 'PRN202100053',
  },
  {
    studentId: '21BCE10054',
    name: 'Omkar Gokhale',
    email: 'omkar.g@vit.edu.in',
    branch: 'Computer Science & Engineering',
    year: 3,
    semester: 6,
    division: 'B',
    department: 'School of Computer Science & Engineering (SCOPE)',
    cgpa: 8.44,
    phone: '+91 94444 55667',
    prn: 'PRN202100054',
  },
  {
    studentId: '21BCE10055',
    name: 'Tanvi Shinde',
    email: 'tanvi.s@vit.edu.in',
    branch: 'Computer Science & Engineering',
    year: 3,
    semester: 6,
    division: 'C',
    department: 'School of Computer Science & Engineering (SCOPE)',
    cgpa: 8.81,
    phone: '+91 94555 66778',
    prn: 'PRN202100055',
  },
  {
    studentId: '21BCE10056',
    name: 'Mohit Agnihotri',
    email: 'mohit.a@vit.edu.in',
    branch: 'Computer Science & Engineering',
    year: 3,
    semester: 6,
    division: 'A',
    department: 'School of Computer Science & Engineering (SCOPE)',
    cgpa: 8.28,
    phone: '+91 94666 77889',
    prn: 'PRN202100056',
  },
  {
    studentId: '21BCE10057',
    name: 'Jaya Sri',
    email: 'jaya.s@vit.edu.in',
    branch: 'Computer Science & Engineering',
    year: 3,
    semester: 6,
    division: 'B',
    department: 'School of Computer Science & Engineering (SCOPE)',
    cgpa: 8.99,
    phone: '+91 94777 88990',
    prn: 'PRN202100057',
  },
  {
    studentId: '21BCE10058',
    name: 'Girish Madhavan',
    email: 'girish.m@vit.edu.in',
    branch: 'Computer Science & Engineering',
    year: 3,
    semester: 6,
    division: 'C',
    department: 'School of Computer Science & Engineering (SCOPE)',
    cgpa: 8.36,
    phone: '+91 94888 99001',
    prn: 'PRN202100058',
  },
  {
    studentId: '21BCE10059',
    name: 'Pooja Bhattacharya',
    email: 'pooja.b@vit.edu.in',
    branch: 'Computer Science & Engineering',
    year: 3,
    semester: 6,
    division: 'A',
    department: 'School of Computer Science & Engineering (SCOPE)',
    cgpa: 9.14,
    phone: '+91 94999 00112',
    prn: 'PRN202100059',
  },
  {
    studentId: '21BCE10060',
    name: 'Sanket Sawant',
    email: 'sanket.s@vit.edu.in',
    branch: 'Computer Science & Engineering',
    year: 3,
    semester: 6,
    division: 'B',
    department: 'School of Computer Science & Engineering (SCOPE)',
    cgpa: 8.11,
    phone: '+91 93000 11223',
    prn: 'PRN202100060',
  },
];

interface TripPopulationConfig {
  experienceId: string;
  prefix: string;
  confirmedCount: number;
  capacity: number;
  includeNishit?: boolean;
  studentIndices: number[];
  status?: 'REGISTERED' | 'COMPLETED';
}

export function buildCompleteCohortAndScenarios() {
  const users: User[] = [];
  const students: StudentProfile[] = [];
  const registrations: Registration[] = [];
  const waitlist: WaitlistEntry[] = [];
  const boardingPasses: BoardingPass[] = [];
  const attendance: AttendanceRecord[] = [];
  const certificates: Certificate[] = [];
  const notifications: AppNotification[] = [];

  // 1. Build Users and Students
  SEED_STUDENT_PROFILES.forEach((sp, idx) => {
    const userId = sp.studentId === '21BCE10482' ? 'usr_student_1' : `usr_student_${idx + 1}`;
    users.push({
      id: userId,
      name: sp.name,
      email: sp.email,
      role: 'STUDENT',
      status: 'ACTIVE',
      createdAt: '2025-01-10T08:00:00Z',
      updatedAt: '2025-01-10T08:00:00Z',
    });

    students.push({
      studentId: sp.studentId,
      userId,
      name: sp.name,
      email: sp.email,
      branch: sp.branch,
      year: sp.year,
      semester: sp.semester,
      division: sp.division,
      department: sp.department,
      cgpa: sp.cgpa,
      phone: sp.phone,
      prn: sp.prn,
      activeBacklogs: (sp as any).activeBacklogs !== undefined ? (sp as any).activeBacklogs : (idx % 15 === 0 && idx > 0 ? (idx % 30 === 0 ? 2 : 1) : 0),
      attendancePercentage: (sp as any).attendancePercentage !== undefined ? (sp as any).attendancePercentage : (82 + ((idx * 7) % 17)),
    });
  });

  // Helper to safely populate a trip's confirmed registrations and boarding passes
  const seedTrip = (cfg: TripPopulationConfig) => {
    const count = Math.min(cfg.confirmedCount, cfg.capacity);
    const chosenIndices = [...cfg.studentIndices];

    // If Nishit should be registered, ensure index 0 is at the front
    if (cfg.includeNishit) {
      if (!chosenIndices.includes(0)) {
        chosenIndices.unshift(0);
      }
    } else {
      // Ensure Nishit is NOT included
      const nIndex = chosenIndices.indexOf(0);
      if (nIndex >= 0) {
        chosenIndices.splice(nIndex, 1);
      }
    }

    for (let i = 0; i < count; i++) {
      const sIndex = chosenIndices[i % chosenIndices.length];
      const sp = SEED_STUDENT_PROFILES[sIndex] || SEED_STUDENT_PROFILES[i % SEED_STUDENT_PROFILES.length];
      const regId = `reg_${cfg.prefix}_${i + 1}`;
      const passNumber = `VIT-BP-2026-${cfg.prefix.toUpperCase()}-${String(100 + i).padStart(3, '0')}`;
      const regStatus = cfg.status || 'REGISTERED';

      const consentDocSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800" style="background:%23ffffff;font-family:sans-serif;"><rect width="600" height="800" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="2"/><rect x="20" y="20" width="560" height="60" fill="%230B2545" rx="6"/><text x="300" y="45" fill="%23ffffff" font-size="16" font-weight="bold" text-anchor="middle">VIDYALANKAR INSTITUTE OF TECHNOLOGY</text><text x="300" y="65" fill="%2393c5fd" font-size="11" text-anchor="middle">Department of Experiential Learning &amp; Industry Relations</text><text x="300" y="110" fill="%230B2545" font-size="14" font-weight="bold" text-anchor="middle">PARENT / GUARDIAN CONSENT &amp; UNDERTAKING FORM</text><line x1="40" y1="125" x2="560" y2="125" stroke="%230B2545" stroke-width="1.5"/><text x="40" y="160" font-size="12" fill="%23475569">Student Name:</text><text x="160" y="160" font-size="12" font-weight="bold" fill="%230f172a">${sp.name}</text><text x="40" y="190" font-size="12" fill="%23475569">Roll Number / ID:</text><text x="160" y="190" font-size="12" font-weight="bold" fill="%230f172a">${sp.studentId}</text><text x="40" y="220" font-size="12" fill="%23475569">Branch / Year:</text><text x="160" y="220" font-size="12" font-weight="bold" fill="%230f172a">${sp.branch} - Year ${sp.year}</text><text x="40" y="250" font-size="12" fill="%23475569">Industrial Visit:</text><text x="160" y="250" font-size="12" font-weight="bold" fill="%230f172a">${cfg.prefix.toUpperCase()} Industrial Facility</text><rect x="40" y="280" width="520" height="120" fill="%23f8fafc" stroke="%23e2e8f0" rx="4"/><text x="55" y="310" font-size="11" fill="%23334155">I hereby grant permission for my ward to participate in the official industrial visit.</text><text x="55" y="335" font-size="11" fill="%23334155">I confirm that my ward will follow all safety rules, industrial guidelines, and instructions.</text><text x="55" y="360" font-size="11" fill="%23334155">Medical Fitness: Verified &amp; Fit. Transport &amp; reporting protocols acknowledged.</text><line x1="40" y1="430" x2="560" y2="430" stroke="%23cbd5e1" stroke-width="1"/><text x="40" y="470" font-size="12" fill="%23475569">Parent / Guardian Signature:</text><path d="M 230 475 Q 260 450 280 470 T 320 460 T 360 475" fill="none" stroke="%231e3a8a" stroke-width="2.5"/><text x="230" y="495" font-size="10" fill="%23166534" font-weight="bold">&#10004; Verified Parent Signature on Record</text><text x="40" y="530" font-size="11" fill="%2364748b">Verification Status: VERIFIED &amp; APPROVED</text><text x="40" y="550" font-size="10" fill="%2394a3b8">Institutional Seal: VIT Department of Experiential Learning</text></svg>`;

      registrations.push({
        id: regId,
        studentId: sp.studentId,
        experienceId: cfg.experienceId,
        status: regStatus,
        consentStatus: 'VERIFIED',
        consentDocumentUrl: consentDocSvg,
        consentVerifiedAt: new Date(Date.now() - (count - i + 2) * 3600000).toISOString(),
        consentUploadedAt: new Date(Date.now() - (count - i + 2) * 3600000).toISOString(),
        registeredAt: new Date(Date.now() - (count - i + 2) * 3600000).toISOString(),
        updatedAt: new Date(Date.now() - (count - i + 2) * 3600000).toISOString(),
      });

      boardingPasses.push({
        id: `pass_${cfg.prefix}_${i + 1}`,
        studentId: sp.studentId,
        experienceId: cfg.experienceId,
        passNumber,
        qrData: JSON.stringify({
          passId: `pass_${cfg.prefix}_${i + 1}`,
          studentId: sp.studentId,
          experienceId: cfg.experienceId,
          passNumber,
        }),
        generatedAt: new Date(Date.now() - (count - i + 2) * 3600000).toISOString(),
        status: regStatus === 'COMPLETED' ? 'USED' : 'VALID',
      });
    }
  };

  // 1. Siemens Smart Infrastructure & Industrial IoT (exp_siemens_01)
  // Capacity: 35 | Confirmed: 22 / 35 | Available: 13 | Nishit IS registered
  seedTrip({
    experienceId: 'exp_siemens_01',
    prefix: 'siemens',
    confirmedCount: 22,
    capacity: 35,
    includeNishit: true,
    studentIndices: [0, 1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22],
  });

  // 2. TCS Innovation Labs — Applied AI & Cloud Architecture (exp_tcs_02)
  // Capacity: 40 | Confirmed: 28 / 40 | Available: 12 | Nishit is NOT registered
  seedTrip({
    experienceId: 'exp_tcs_02',
    prefix: 'tcs',
    confirmedCount: 28,
    capacity: 40,
    includeNishit: false,
    studentIndices: [1, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 27, 28, 29, 39, 40, 41, 50, 51],
  });

  // 3. Tata Motors EV Assembly & Robotic Body Shop (exp_tatamotors_03)
  // Capacity: 30 | Confirmed: 18 / 30 | Available: 12 | Nishit IS registered (for 3-day reminder testing on 2026-08-31)
  seedTrip({
    experienceId: 'exp_tatamotors_03',
    prefix: 'tatamotors',
    confirmedCount: 18,
    capacity: 30,
    includeNishit: true,
    studentIndices: [0, 3, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 5, 6, 7, 8],
  });

  // 4. Reliance Jio 5G Core & Green Energy Data Center (exp_reliance_04)
  // Capacity: 45 | Confirmed: 22 / 45 | Available: 23 | Nishit is NOT registered (User example!)
  seedTrip({
    experienceId: 'exp_reliance_04',
    prefix: 'reliance',
    confirmedCount: 22,
    capacity: 45,
    includeNishit: false,
    studentIndices: [1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 27, 28, 35, 36, 39, 40, 51, 52],
  });

  // 5. Larsen & Toubro Heavy Engineering & Advanced Robotics (exp_lt_05)
  // Capacity: 30 | Confirmed: 21 / 30 | Available: 9 | Nishit is NOT registered
  seedTrip({
    experienceId: 'exp_lt_05',
    prefix: 'lt',
    confirmedCount: 21,
    capacity: 30,
    includeNishit: false,
    studentIndices: [3, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 42, 43, 44, 45, 5, 6, 7, 8, 9, 10],
  });

  // 6. Infosys Autonomous Systems & Software Engineering (exp_infosys_06)
  // Capacity: 50 | Confirmed: 34 / 50 | Available: 16 | Nishit is NOT registered
  seedTrip({
    experienceId: 'exp_infosys_06',
    prefix: 'infosys',
    confirmedCount: 34,
    capacity: 50,
    includeNishit: false,
    studentIndices: [1, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 27, 28, 29, 39, 40, 41, 50, 51, 52, 53, 54, 55, 56, 57],
  });

  // 7. Mahindra & Mahindra EV Powertrain & Crash Safety (exp_mahindra_07)
  // Capacity: 32 | Confirmed: 20 / 32 | Available: 12 | Nishit is NOT registered
  seedTrip({
    experienceId: 'exp_mahindra_07',
    prefix: 'mahindra',
    confirmedCount: 20,
    capacity: 32,
    includeNishit: false,
    studentIndices: [3, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 5, 6, 7, 8, 9, 10, 11],
  });

  // 8. Bosch ADAS Radar & Embedded Automotive Electronics (exp_bosch_08)
  // Capacity: 28 | Confirmed: 19 / 28 | Available: 9 | Nishit is NOT registered
  seedTrip({
    experienceId: 'exp_bosch_08',
    prefix: 'bosch',
    confirmedCount: 19,
    capacity: 28,
    includeNishit: false,
    studentIndices: [1, 2, 5, 6, 7, 8, 27, 28, 29, 35, 36, 37, 38, 12, 13, 14, 15, 16, 17],
  });

  // 9. Adani Automated Container Terminal & Green Hydrogen Hub (exp_adani_09)
  // Capacity: 35 | Confirmed: 24 / 35 | Available: 11 | Nishit is NOT registered
  seedTrip({
    experienceId: 'exp_adani_09',
    prefix: 'adani',
    confirmedCount: 24,
    capacity: 35,
    includeNishit: false,
    studentIndices: [3, 5, 6, 7, 8, 27, 28, 30, 31, 32, 35, 36, 42, 43, 44, 45, 11, 12, 13, 14, 15, 16, 17, 18],
  });

  // 10. ISRO Satellite Application Centre (exp_isro_10) - COMPLETED
  // Capacity: 30 | Confirmed & Attended: 25 / 30 | Nishit IS registered & attended
  const isroStudents = [0, 1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 27, 28, 39, 40, 41];
  for (let i = 0; i < 25; i++) {
    const sp = SEED_STUDENT_PROFILES[isroStudents[i]];
    const regId = `reg_isro_${i + 1}`;
    const certNumber = `IV-VIT-2026-${881920 + i}`;

    registrations.push({
      id: regId,
      studentId: sp.studentId,
      experienceId: 'exp_isro_10',
      status: 'COMPLETED',
      consentStatus: 'VERIFIED',
      consentVerifiedAt: '2026-06-15T09:30:00Z',
      consentUploadedAt: '2026-06-15T09:30:00Z',
      registeredAt: '2026-06-15T09:30:00Z',
      updatedAt: '2026-07-21T18:00:00Z',
    });

    boardingPasses.push({
      id: `pass_isro_${i + 1}`,
      studentId: sp.studentId,
      experienceId: 'exp_isro_10',
      passNumber: `VIT-BP-2026-ISRO-${String(100 + i).padStart(3, '0')}`,
      qrData: JSON.stringify({
        passId: `pass_isro_${i + 1}`,
        studentId: sp.studentId,
        experienceId: 'exp_isro_10',
      }),
      generatedAt: '2026-06-15T09:30:05Z',
      status: 'USED',
    });

    attendance.push({
      id: `att_isro_${i + 1}`,
      studentId: sp.studentId,
      experienceId: 'exp_isro_10',
      status: 'PRESENT',
      markedBy: 'usr_faculty_1',
      timestamp: '2026-07-20T08:15:00Z',
      notes: 'Attended full ISRO telemetry and mission control walkthrough.',
    });

    certificates.push({
      id: `cert_isro_${i + 1}`,
      certificateId: certNumber,
      studentId: sp.studentId,
      experienceId: 'exp_isro_10',
      status: 'ISSUED',
      issuedAt: '2026-07-22T10:00:00Z',
      issuedBy: 'usr_faculty_1',
      createdAt: '2026-07-22T10:00:00Z',
      updatedAt: '2026-07-22T10:00:00Z',
    });
  }

  // 11. Godrej Aerospace Precision Tooling & Smart Factory (exp_godrej_11)
  // Capacity: 25 | Confirmed: 17 / 25 | Available: 8 | Nishit is NOT registered
  seedTrip({
    experienceId: 'exp_godrej_11',
    prefix: 'godrej',
    confirmedCount: 17,
    capacity: 25,
    includeNishit: false,
    studentIndices: [3, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 5, 6, 7, 8],
  });

  // 12. BHEL High-Voltage Transmission & Electrical Machinery (exp_bhel_12)
  // Capacity: 30 | Confirmed: 16 / 30 | Available: 14 | Nishit is NOT registered
  seedTrip({
    experienceId: 'exp_bhel_12',
    prefix: 'bhel',
    confirmedCount: 16,
    capacity: 30,
    includeNishit: false,
    studentIndices: [2, 3, 27, 28, 29, 30, 31, 32, 35, 36, 37, 38, 5, 6, 7, 8],
  });

  // 13. DRDO Advanced Armament & Defense Systems R&D (exp_drdo_13) - 100% Full + Waitlist Queue
  // Capacity: 24 | Confirmed: 24 / 24 | Available: 0 | Waitlist: 8 / 12 (Nishit is Waitlisted at Position #2)
  const drdoConfirmedStudents = [
    8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 27, 28, 29, 30, 31, 32, 33, 34, 35,
  ];
  for (let i = 0; i < 24; i++) {
    const sp = SEED_STUDENT_PROFILES[drdoConfirmedStudents[i]];
    const regId = `reg_drdo_${i + 1}`;
    const passNumber = `VIT-BP-2026-DRDO-${String(100 + i).padStart(3, '0')}`;

    registrations.push({
      id: regId,
      studentId: sp.studentId,
      experienceId: 'exp_drdo_13',
      status: 'REGISTERED',
      consentStatus: 'VERIFIED',
      consentVerifiedAt: new Date(Date.now() - (48 - i) * 3600000).toISOString(),
      consentUploadedAt: new Date(Date.now() - (48 - i) * 3600000).toISOString(),
      registeredAt: new Date(Date.now() - (48 - i) * 3600000).toISOString(),
      updatedAt: new Date(Date.now() - (48 - i) * 3600000).toISOString(),
    });

    boardingPasses.push({
      id: `pass_drdo_${i + 1}`,
      studentId: sp.studentId,
      experienceId: 'exp_drdo_13',
      passNumber,
      qrData: JSON.stringify({
        passId: `pass_drdo_${i + 1}`,
        studentId: sp.studentId,
        experienceId: 'exp_drdo_13',
        passNumber,
      }),
      generatedAt: new Date(Date.now() - (48 - i) * 3600000).toISOString(),
      status: 'VALID',
    });
  }

  // DRDO Waitlist (8 students in FIFO order):
  // Position 1: Priya Sharma (21BCE10214)
  // Position 2: Nishit Rathod (21BCE10482) - Logged in student
  // Position 3: Rahul Verma (21BEE10319)
  // Position 4: Ananya Iyer (22BME10105)
  // Position 5: Rohan Kulkarni (21BIT10599)
  // Position 6: Aarav Patel (21BCE10001)
  // Position 7: Sneha Deshmukh (21BCE10002)
  // Position 8: Tanmay Joshi (21BCE10003)
  const drdoWaitlistStudents = [
    '21BCE10214',
    '21BCE10482',
    '21BEE10319',
    '22BME10105',
    '21BIT10599',
    '21BCE10001',
    '21BCE10002',
    '21BCE10003',
  ];

  drdoWaitlistStudents.forEach((stId, idx) => {
    waitlist.push({
      id: `wait_drdo_${idx + 1}`,
      studentId: stId,
      experienceId: 'exp_drdo_13',
      position: idx + 1,
      joinedAt: new Date(Date.now() - (8 - idx) * 3600000).toISOString(),
      status: 'ACTIVE',
    });
  });

  // 14. BARC Nuclear Instrumentation & Radiation Safety (exp_barc_14)
  // Capacity: 25 | Confirmed: 15 / 25 | Available: 10 | Nishit is NOT registered
  seedTrip({
    experienceId: 'exp_barc_14',
    prefix: 'barc',
    confirmedCount: 15,
    capacity: 25,
    includeNishit: false,
    studentIndices: [46, 47, 48, 49, 27, 28, 29, 35, 36, 5, 6, 7, 8, 9, 10],
  });

  // Add standard initial notifications for Nishit Rathod (usr_student_1)
  notifications.push(
    {
      id: 'notif_1',
      recipientId: 'usr_student_1',
      type: 'REGISTRATION_CONFIRMED',
      title: 'Registration Confirmed: Siemens Smart Infrastructure',
      message: 'Your seat has been confirmed with Boarding Pass #VIT-BP-2026-SIEMENS-100.',
      read: false,
      createdAt: '2026-07-01T10:00:05Z',
      relatedEntityId: 'exp_siemens_01',
      entityType: 'EXPERIENCE',
    },
    {
      id: 'notif_wait_1',
      recipientId: 'usr_student_1',
      type: 'WAITLIST_JOINED',
      title: 'Waitlist Position Confirmed: DRDO Defense Systems',
      message: 'You are currently at Position #2 on the waitlist queue for DRDO Advanced Armament & Defense Systems.',
      read: false,
      createdAt: '2026-08-10T14:30:00Z',
      relatedEntityId: 'exp_drdo_13',
      entityType: 'EXPERIENCE',
    },
    {
      id: 'notif_cert_1',
      recipientId: 'usr_student_1',
      type: 'CERTIFICATE_ISSUED',
      title: 'Certificate Issued: ISRO Spacecraft Control Centre',
      message: 'Your official certificate (IV-VIT-2026-881920) is ready to view and download.',
      read: false,
      createdAt: '2026-07-22T10:00:00Z',
      relatedEntityId: 'exp_isro_10',
      entityType: 'EXPERIENCE',
    }
  );

  return {
    users,
    students,
    registrations,
    waitlist,
    boardingPasses,
    attendance,
    certificates,
    notifications,
  };
}
