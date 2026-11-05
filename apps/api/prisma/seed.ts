import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
const prisma = new PrismaClient();
async function main() {
  const academy = await prisma.academy.upsert({
    where:{slug:'shape-full'},
    update:{name:'Shape Full Academia',logoUrl:'/logo-shapefull.jpg',primaryColor:'#6B2FA3'},
    create:{name:'Shape Full Academia',slug:'shape-full',email:'contato@shapefull.local',logoUrl:'/logo-shapefull.jpg',primaryColor:'#6B2FA3'}
  });
  const passwordHash = await bcrypt.hash('Fitness360!Demo', 12);
  await prisma.user.upsert({
    where:{email:'admin@demo.fitness360.local'},
    update:{passwordHash,academyId:academy.id,role:Role.ACADEMY_ADMIN},
    create:{name:'Administrador Demo',email:'admin@demo.fitness360.local',passwordHash,academyId:academy.id,role:Role.ACADEMY_ADMIN}
  });
  console.log('Seed concluído. Academia:',academy.slug);
}
main().finally(()=>prisma.$disconnect());
