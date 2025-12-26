import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
  log: ['info', 'warn', 'error'],
});

async function main() {
  await prisma.$connect();
  await prisma.nin.createMany({
    data: [
      {
        nin: '20014567890',
        fullName: 'Chukwudi Okonkwo',
        dateOfBirth: new Date('2000-03-15'),
        gender: 'Male',
        stateOfOrigin: 'Anambra',
        phoneNumber: '08034567890',
        email: 'chukwudi.okonkwo@example.com',
      },
      {
        nin: '19981234567',
        fullName: 'Aminat Ibrahim',
        dateOfBirth: new Date('1998-07-22'),
        gender: 'Female',
        stateOfOrigin: 'Kano',
        phoneNumber: '08123456789',
        email: 'aminat.ibrahim@example.com',
      },
      {
        nin: '20021098765',
        fullName: 'Adebayo Olamide',
        dateOfBirth: new Date('2002-11-08'),
        gender: 'Male',
        stateOfOrigin: 'Lagos',
        phoneNumber: '07061234567',
        email: 'adebayo.olamide@example.com',
      },
      {
        nin: '19990543210',
        fullName: 'Chioma Eze',
        dateOfBirth: new Date('1999-04-30'),
        gender: 'Female',
        stateOfOrigin: 'Enugu',
        phoneNumber: '09054321098',
        email: 'chioma.eze@example.com',
      },
      {
        nin: '20013456789',
        fullName: 'Muhammad Bello',
        dateOfBirth: new Date('2001-06-12'),
        gender: 'Male',
        stateOfOrigin: 'Sokoto',
        phoneNumber: '08067891234',
        email: 'muhammad.bello@example.com',
      },
      {
        nin: '19978901234',
        fullName: 'Adanna Nwosu',
        dateOfBirth: new Date('1997-09-18'),
        gender: 'Female',
        stateOfOrigin: 'Imo',
        phoneNumber: '08189012345',
        email: 'adanna.nwosu@example.com',
      },
      {
        nin: '20035678901',
        fullName: 'Tunde Adeyemi',
        dateOfBirth: new Date('2003-02-27'),
        gender: 'Male',
        stateOfOrigin: 'Oyo',
        phoneNumber: '07039876543',
        email: 'tunde.adeyemi@example.com',
      },
      {
        nin: '19986789012',
        fullName: 'Fatima Abdullahi',
        dateOfBirth: new Date('1998-12-05'),
        gender: 'Female',
        stateOfOrigin: 'Kaduna',
        phoneNumber: '09067890123',
        email: 'fatima.abdullahi@example.com',
      },
      {
        nin: '20017890123',
        fullName: 'Obinna Okafor',
        dateOfBirth: new Date('2001-08-14'),
        gender: 'Male',
        stateOfOrigin: 'Abia',
        phoneNumber: '08078901234',
        email: 'obinna.okafor@example.com',
      },
      {
        nin: '19992345678',
        fullName: 'Funmilayo Balogun',
        dateOfBirth: new Date('1999-10-20'),
        gender: 'Female',
        stateOfOrigin: 'Osun',
        phoneNumber: '08134567890',
        email: 'funmilayo.balogun@example.com',
      },
      {
        nin: '20028901234',
        fullName: 'Yusuf Aliyu',
        dateOfBirth: new Date('2002-05-03'),
        gender: 'Male',
        stateOfOrigin: 'Bauchi',
        phoneNumber: '07045678901',
        email: 'yusuf.aliyu@example.com',
      },
      {
        nin: '19975678901',
        fullName: 'Amarachi Okeke',
        dateOfBirth: new Date('1997-01-29'),
        gender: 'Female',
        stateOfOrigin: 'Anambra',
        phoneNumber: '09023456789',
        email: 'amarachi.okeke@example.com',
      },
      {
        nin: '20046789012',
        fullName: 'Emeka Chukwu',
        dateOfBirth: new Date('2004-07-17'),
        gender: 'Male',
        stateOfOrigin: 'Ebonyi',
        phoneNumber: '08056789012',
        email: 'emeka.chukwu@example.com',
      },
      {
        nin: '19983456789',
        fullName: 'Zainab Mohammed',
        dateOfBirth: new Date('1998-03-11'),
        gender: 'Female',
        stateOfOrigin: 'Jigawa',
        phoneNumber: '08167890123',
        email: 'zainab.mohammed@example.com',
      },
      {
        nin: '20012345678',
        fullName: 'Olumide Lawal',
        dateOfBirth: new Date('2001-12-01'),
        gender: 'Male',
        stateOfOrigin: 'Ogun',
        phoneNumber: '07078901234',
        email: 'olumide.lawal@example.com',
      },
      {
        nin: '19991234567',
        fullName: 'Ngozi Obi',
        dateOfBirth: new Date('1999-05-25'),
        gender: 'Female',
        stateOfOrigin: 'Delta',
        phoneNumber: '09089012345',
        email: 'ngozi.obi@example.com',
      },
      {
        nin: '20030123456',
        fullName: 'Ibrahim Hassan',
        dateOfBirth: new Date('2003-09-09'),
        gender: 'Male',
        stateOfOrigin: 'Plateau',
        phoneNumber: '08090123456',
        email: 'ibrahim.hassan@example.com',
      },
      {
        nin: '19967890123',
        fullName: 'Abigail Akintola',
        dateOfBirth: new Date('1996-11-16'),
        gender: 'Female',
        stateOfOrigin: 'Ekiti',
        phoneNumber: '08101234567',
        email: 'abigail.akintola@example.com',
      },
      {
        nin: '20024567890',
        fullName: 'Chinedu Nnamdi',
        dateOfBirth: new Date('2002-04-04'),
        gender: 'Male',
        stateOfOrigin: 'Rivers',
        phoneNumber: '07012345678',
        email: 'chinedu.nnamdi@example.com',
      },
      {
        nin: '19989012345',
        fullName: 'Halima Usman',
        dateOfBirth: new Date('1998-08-28'),
        gender: 'Female',
        stateOfOrigin: 'Kebbi',
        phoneNumber: '09034567890',
        email: 'halima.usman@example.com',
      },
    ],
    skipDuplicates: true,
  });

  console.log('Seeded 20 mock NIN records with realistic Nigerian data!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
