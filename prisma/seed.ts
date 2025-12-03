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
  // Dados dos usuários de teste
  const users = [
    {
      name: 'Administrador',
      email: 'admin@agendacultural.com',
      password: '123456',
      role: 'ADMIN' as const,
    },
    {
      name: 'Promoter Teste',
      email: 'promoter@agendacultural.com',
      password: '123456',
      role: 'PROMOTER' as const,
    },
    {
      name: 'Usuário Comum',
      email: 'usuario@agendacultural.com',
      password: '123456',
      role: 'USER' as const,
    },
  ];

  console.log('Iniciando seed de usuários...\n');

  // Função auxiliar para criar ou atualizar usuário de forma segura
  async function upsertUser(userData: typeof users[0], approvedBy?: string) {
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    const hashedPassword = await hash(userData.password, 10);
    const updateData: any = {
      name: userData.name,
      password: hashedPassword, // Sempre atualiza a senha para garantir consistência
      role: userData.role,
    };

    // Se for promoter e não estiver aprovado, adiciona dados de aprovação
    if (userData.role === 'PROMOTER' && approvedBy) {
      updateData.approvedAt = new Date();
      updateData.approvedBy = approvedBy;
    }

    if (existingUser) {
      // Verifica se precisa atualizar (sempre atualiza senha para garantir consistência)
      const needsUpdate =
        existingUser.role !== userData.role ||
        existingUser.name !== userData.name ||
        (userData.role === 'PROMOTER' && !existingUser.approvedAt);

      // Sempre atualiza para garantir que a senha esteja correta
      const updated = await prisma.user.update({
        where: { email: userData.email },
        data: updateData,
      });

      if (needsUpdate) {
        console.log(`✅ Usuário ${userData.role} atualizado com sucesso!`);
      } else {
        console.log(`✅ Usuário ${userData.role} já existe. Senha atualizada para garantir consistência.`);
      }
      return updated;
    } else {
      // Cria novo usuário
      const created = await prisma.user.create({
        data: updateData,
      });
      console.log(`✅ Usuário ${userData.role} criado com sucesso!`);
      return created;
    }
  }

  // Cria ou atualiza o admin primeiro (necessário para aprovar o promoter)
  const admin = await upsertUser(users[0]);
  console.log(`   Email: ${admin.email}`);
  console.log(`   Senha: ${users[0].password}`);
  console.log(`   ID: ${admin.id}\n`);

  // Cria ou atualiza o promoter (aprovado pelo admin)
  const promoter = await upsertUser(users[1], admin.id);
  console.log(`   Email: ${promoter.email}`);
  console.log(`   Senha: ${users[1].password}`);
  if (promoter.role === 'PROMOTER') {
    console.log(`   Status: ${promoter.approvedAt ? 'Aprovado' : 'Pendente'}`);
  }
  console.log(`   ID: ${promoter.id}\n`);

  // Cria ou atualiza o usuário comum
  const user = await upsertUser(users[2]);
  console.log(`   Email: ${user.email}`);
  console.log(`   Senha: ${users[2].password}`);
  console.log(`   ID: ${user.id}\n`);

  console.log('🎉 Seed concluído com sucesso!');
  console.log('\n📋 Resumo dos usuários:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`ADMIN:    ${users[0].email} / ${users[0].password}`);
  console.log(`PROMOTER: ${users[1].email} / ${users[1].password}`);
  console.log(`USER:     ${users[2].email} / ${users[2].password}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
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

