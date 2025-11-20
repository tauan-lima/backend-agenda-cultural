import 'dotenv/config';
import { PrismaClient } from '../prisma/@prisma/client/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcrypt';

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminEmail = 'admin@agendacultural.com';
  const adminPassword = '123456';
  const adminName = 'Administrador';

  // Verifica se o usuário admin já existe
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log('Usuário admin já existe no banco de dados.');
    return;
  }

  // Faz hash da senha
  const hashedPassword = await hash(adminPassword, 10);

  // Cria o usuário admin
  const admin = await prisma.user.create({
    data: {
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
    },
  });

  console.log('Usuário admin criado com sucesso!');
  console.log(`   Email: ${admin.email}`);
  console.log(`   ID: ${admin.id}`);
}

main()
  .catch((e) => {
    console.error('Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

