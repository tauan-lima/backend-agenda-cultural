import 'dotenv/config';
import { PrismaClient } from '../prisma/@prisma/client/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcrypt';
import { EventStatus } from '../prisma/@prisma/client/enums';

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

    // Se for promoter e approvedBy for fornecido, sempre aprova (garante que está aprovado)
    if (userData.role === 'PROMOTER' && approvedBy) {
      updateData.approvedAt = new Date();
      updateData.approvedBy = approvedBy;
    } else if (userData.role === 'PROMOTER' && !approvedBy) {
      // Se for promoter mas não tem approvedBy, remove aprovação (caso exista)
      updateData.approvedAt = null;
      updateData.approvedBy = null;
    }

    if (existingUser) {
      // Verifica se precisa atualizar (sempre atualiza senha para garantir consistência)
      const needsUpdate =
        existingUser.role !== userData.role ||
        existingUser.name !== userData.name ||
        (userData.role === 'PROMOTER' && approvedBy && !existingUser.approvedAt) ||
        (userData.role === 'PROMOTER' && approvedBy && existingUser.approvedBy !== approvedBy);

      // Sempre atualiza para garantir que a senha e aprovação estejam corretas
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

  // Criar eventos apenas se o promoter estiver aprovado
  if (promoter.role === 'PROMOTER' && promoter.approvedAt) {
    console.log('Iniciando seed de eventos...\n');

    // Limpar eventos existentes do promoter (opcional - para idempotência)
    await prisma.event.deleteMany({
      where: { promoterId: promoter.id },
    });

    // Locais públicos em Feira de Santana - BA (10 eventos)
    const locaisPublicos = [
      'Parque da Cidade, Feira de Santana - BA',
      'Praça da Matriz, Centro, Feira de Santana - BA',
      'Parque Erivaldo Cerqueira, Feira de Santana - BA',
      'Praça do Fórum, Feira de Santana - BA',
      'Parque da Lagoa, Feira de Santana - BA',
      'Praça da Bandeira, Feira de Santana - BA',
      'Parque do Saber, Feira de Santana - BA',
      'Praça do Mercado, Feira de Santana - BA',
      'Parque da Juventude, Feira de Santana - BA',
      'Praça do Campo Limpo, Feira de Santana - BA',
    ];

    // Locais privados - Casas de festas em Feira de Santana - BA (5 eventos)
    const casasDeFesta = [
      'Casa de Festas Espaço Luxo - Av. Getúlio Vargas, 1000, Feira de Santana - BA',
      'Salão de Eventos Grand Ballroom - Rua Barão do Rio Branco, 250, Feira de Santana - BA',
      'Casa de Festas Golden Hall - Av. Senhor dos Passos, 500, Feira de Santana - BA',
      'Espaço Eventos Premium - Rua Conselheiro Franco, 2000, Feira de Santana - BA',
      'Salão de Festas Elite - Av. Maria Quitéria, 300, Feira de Santana - BA',
    ];

    // Função para gerar data futura aleatória
    function getRandomFutureDate(daysFromNow: number): Date {
      const date = new Date();
      date.setDate(date.getDate() + daysFromNow);
      return date;
    }

    // Função para criar evento
    async function createEvent(
      title: string,
      description: string,
      location: string,
      startDate: Date,
      endDate: Date,
      status: EventStatus,
      requiresRegistration: boolean = true,
      imageUrl?: string
    ) {
      const eventData: any = {
        title,
        description,
        location,
        startDate,
        endDate,
        status,
        requiresRegistration,
        promoterId: promoter.id,
      };

      if (status === EventStatus.APPROVED) {
        eventData.approvedBy = admin.id;
        eventData.approvedAt = new Date();
      }

      if (imageUrl) {
        eventData.imageUrl = imageUrl;
      }

      return await prisma.event.create({
        data: eventData,
      });
    }

    const eventos = [];

    // Criar 10 eventos em locais públicos (todos aprovados)
    const titulosPublicos = [
      'Festival de Música ao Ar Livre',
      'Feira de Artesanato Cultural',
      'Show de Dança Contemporânea',
      'Festival Gastronômico',
      'Exposição de Arte Urbana',
      'Concerto ao Pôr do Sol',
      'Festival de Teatro de Rua',
      'Feira de Livros e Literatura',
      'Festival de Cinema ao Ar Livre',
      'Show de Música Popular Brasileira',
    ];

    const descricoesPublicos = [
      'Um evento incrível com apresentações musicais de diversos artistas locais. Venha aproveitar a música ao ar livre!',
      'Feira com artesãos de toda a região apresentando seus trabalhos únicos. Artesanato, comida e cultura!',
      'Espetáculo de dança contemporânea com coreografias inovadoras e performances emocionantes.',
      'Festival gastronômico com chefs renomados apresentando pratos especiais e sabores únicos.',
      'Exposição de arte urbana com obras de artistas locais e internacionais transformando o espaço público.',
      'Concerto especial ao pôr do sol com repertório clássico e popular em um ambiente único.',
      'Festival de teatro de rua com apresentações gratuitas e interativas para toda a família.',
      'Feira literária com lançamentos de livros, debates e encontros com autores.',
      'Sessões de cinema ao ar livre com filmes nacionais e internacionais em uma experiência única.',
      'Show com grandes nomes da música popular brasileira em um ambiente descontraído e acolhedor.',
    ];

    for (let i = 0; i < 10; i++) {
      const startDate = getRandomFutureDate(7 + i * 3); // Eventos espaçados
      const endDate = new Date(startDate);
      endDate.setHours(startDate.getHours() + 4); // Duração de 4 horas

      const evento = await createEvent(
        titulosPublicos[i],
        descricoesPublicos[i],
        locaisPublicos[i],
        startDate,
        endDate,
        EventStatus.APPROVED,
        Math.random() > 0.3, // 70% requerem inscrição
        i % 3 === 0 ? `https://picsum.photos/800/600?random=${i}` : undefined
      );

      eventos.push(evento);
      console.log(`✅ Evento criado: ${titulosPublicos[i]} (${EventStatus.APPROVED})`);
    }

    // Criar 4 eventos em casas de festas (aprovados)
    const titulosPrivados = [
      'Festa de Aniversário Premium',
      'Casamento de Gala',
      'Evento Corporativo Exclusivo',
      'Festa de Formatura VIP',
    ];

    const descricoesPrivados = [
      'Festa de aniversário em ambiente luxuoso com decoração temática, buffet completo e animação profissional.',
      'Cerimônia de casamento em local elegante com decoração sofisticada e serviço de alta qualidade.',
      'Evento corporativo exclusivo para networking e apresentações empresariais em ambiente premium.',
      'Festa de formatura em espaço moderno com pista de dança, iluminação profissional e som de qualidade.',
    ];

    for (let i = 0; i < 4; i++) {
      const startDate = getRandomFutureDate(10 + i * 5);
      const endDate = new Date(startDate);
      endDate.setHours(startDate.getHours() + 6); // Duração de 6 horas

      const evento = await createEvent(
        titulosPrivados[i],
        descricoesPrivados[i],
        casasDeFesta[i],
        startDate,
        endDate,
        EventStatus.APPROVED,
        true, // Eventos privados sempre requerem inscrição
        `https://picsum.photos/800/600?random=${10 + i}`
      );

      eventos.push(evento);
      console.log(`✅ Evento criado: ${titulosPrivados[i]} (${EventStatus.APPROVED})`);
    }

    // Criar 1 evento em casa de festas (PENDENTE)
    const eventoPendente = await createEvent(
      'Festa de Lançamento Exclusiva',
      'Evento de lançamento de produto em ambiente exclusivo com coquetel, apresentação e networking.',
      casasDeFesta[4],
      getRandomFutureDate(15),
      (() => {
        const date = getRandomFutureDate(15);
        date.setHours(date.getHours() + 5);
        return date;
      })(),
      EventStatus.PENDING,
      true,
      'https://picsum.photos/800/600?random=15'
    );

    eventos.push(eventoPendente);
    console.log(`⏳ Evento criado: Festa de Lançamento Exclusiva (${EventStatus.PENDING})`);

    console.log(`\n✅ Total de ${eventos.length} eventos criados!`);
    console.log(`   - ${eventos.filter(e => e.status === EventStatus.APPROVED).length} aprovados`);
    console.log(`   - ${eventos.filter(e => e.status === EventStatus.PENDING).length} pendentes`);
    console.log(`   - ${eventos.filter(e => !e.requiresRegistration).length} eventos públicos (sem inscrição)`);
    console.log(`   - ${eventos.filter(e => e.requiresRegistration).length} eventos com inscrição`);
  } else {
    console.log('⚠️  Promoter não está aprovado. Eventos não serão criados.');
  }

  console.log('\n🎉 Seed concluído com sucesso!');
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

