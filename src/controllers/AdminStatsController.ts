import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/database/prisma';
import { EventStatus, UserRole } from '../../prisma/@prisma/client/enums';

class AdminStatsController {
  async index(req: Request, res: Response, next: NextFunction) {
    try {
      // Total de inscrições
      const totalInscritos = await prisma.eventRegistration.count();

      // Total de eventos
      const totalEventos = await prisma.event.count();

      // Eventos por status
      const eventosPorStatusRaw = await prisma.event.groupBy({
        by: ['status'],
        _count: {
          id: true,
        },
      });

      const eventosPorStatus = {
        PENDING: 0,
        APPROVED: 0,
        REJECTED: 0,
        CANCELLED: 0,
      };

      eventosPorStatusRaw.forEach((item) => {
        eventosPorStatus[item.status] = item._count.id;
      });

      // Usuários ativos (últimos 30 dias) - usando updatedAt como aproximação
      const trintaDiasAtras = new Date();
      trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

      const totalUsuariosAtivos = await prisma.user.count({
        where: {
          updatedAt: {
            gte: trintaDiasAtras,
          },
        },
      });

      // Total de usuários
      const totalUsuarios = await prisma.user.count();

      // Promoters
      const totalPromoters = await prisma.user.count({
        where: {
          role: UserRole.PROMOTER,
        },
      });

      const promotersPendentes = await prisma.user.count({
        where: {
          role: UserRole.PROMOTER,
          approvedAt: null,
        },
      });

      const promotersAprovados = await prisma.user.count({
        where: {
          role: UserRole.PROMOTER,
          approvedAt: {
            not: null,
          },
        },
      });

      // Locais mais populares (top 10)
      const locaisMaisPopularesRaw = await prisma.event.groupBy({
        by: ['location'],
        _count: {
          id: true,
        },
        where: {
          status: EventStatus.APPROVED,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 10,
      });

      // Adicionar total de inscrições por local
      const locaisMaisPopulares = await Promise.all(
        locaisMaisPopularesRaw.map(async (local) => {
          const eventosDoLocal = await prisma.event.findMany({
            where: {
              location: local.location,
              status: EventStatus.APPROVED,
            },
            select: {
              id: true,
            },
          });

          const totalInscritosLocal = await prisma.eventRegistration.count({
            where: {
              eventId: {
                in: eventosDoLocal.map((e) => e.id),
              },
            },
          });

          return {
            localizacao: local.location,
            totalEventos: local._count.id,
            totalInscritos: totalInscritosLocal,
          };
        })
      );

      // Taxa de aceitação - Eventos
      const eventosAprovados = eventosPorStatus.APPROVED;
      const eventosRejeitados = eventosPorStatus.REJECTED;
      const totalAvaliados = eventosAprovados + eventosRejeitados;
      const taxaAprovacaoEventos =
        totalAvaliados > 0 ? Number(((eventosAprovados / totalAvaliados) * 100).toFixed(2)) : 0;

      // Taxa de aceitação - Promoters
      // Como não temos histórico de rejeição direto, vamos considerar apenas
      // os promoters que foram avaliados (aprovados + pendentes)
      // Promoters rejeitados voltam para USER, mas não temos como rastrear isso
      const promotersRejeitadosCount = 0; // Não temos como rastrear diretamente sem histórico

      const totalPromotersAvaliados = promotersAprovados + promotersPendentes;
      const taxaAprovacaoPromoters =
        totalPromotersAvaliados > 0 && promotersAprovados > 0
          ? Number(((promotersAprovados / totalPromotersAvaliados) * 100).toFixed(2))
          : 0;

      // Eventos por mês (últimos 6 meses)
      const seisMesesAtras = new Date();
      seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 6);

      const eventosDetalhados = await prisma.event.findMany({
        where: {
          createdAt: {
            gte: seisMesesAtras,
          },
        },
        select: {
          createdAt: true,
          status: true,
        },
      });

      // Agrupar por mês
      const eventosPorMesMap = new Map<
        string,
        { total: number; aprovados: number; pendentes: number }
      >();

      eventosDetalhados.forEach((evento) => {
        const mes = new Date(evento.createdAt).toLocaleDateString('pt-BR', {
          month: 'long',
          year: 'numeric',
        });

        const stats = eventosPorMesMap.get(mes) || { total: 0, aprovados: 0, pendentes: 0 };
        stats.total++;

        if (evento.status === EventStatus.APPROVED) stats.aprovados++;
        if (evento.status === EventStatus.PENDING) stats.pendentes++;

        eventosPorMesMap.set(mes, stats);
      });

      const eventosPorMes = Array.from(eventosPorMesMap.entries())
        .map(([mes, stats]) => ({
          mes,
          ...stats,
        }))
        .sort((a, b) => {
          // Ordenar cronologicamente
          try {
            const [mesA, anoA] = a.mes.split(' ');
            const [mesB, anoB] = b.mes.split(' ');
            const dateA = new Date(parseInt(anoA), getMonthNumber(mesA) - 1);
            const dateB = new Date(parseInt(anoB), getMonthNumber(mesB) - 1);
            return dateA.getTime() - dateB.getTime();
          } catch {
            return 0;
          }
        })
        .slice(-6);

      // Inscrições por mês (últimos 6 meses)
      const inscricoesDetalhadas = await prisma.eventRegistration.findMany({
        where: {
          createdAt: {
            gte: seisMesesAtras,
          },
        },
        select: {
          createdAt: true,
        },
      });

      const inscricoesPorMesMap = new Map<string, number>();

      inscricoesDetalhadas.forEach((inscricao) => {
        const mes = new Date(inscricao.createdAt).toLocaleDateString('pt-BR', {
          month: 'long',
          year: 'numeric',
        });

        const total = inscricoesPorMesMap.get(mes) || 0;
        inscricoesPorMesMap.set(mes, total + 1);
      });

      const inscricoesPorMes = Array.from(inscricoesPorMesMap.entries())
        .map(([mes, total]) => ({
          mes,
          total,
        }))
        .sort((a, b) => {
          // Ordenar cronologicamente
          try {
            const [mesA, anoA] = a.mes.split(' ');
            const [mesB, anoB] = b.mes.split(' ');
            const dateA = new Date(parseInt(anoA), getMonthNumber(mesA) - 1);
            const dateB = new Date(parseInt(anoB), getMonthNumber(mesB) - 1);
            return dateA.getTime() - dateB.getTime();
          } catch {
            return 0;
          }
        })
        .slice(-6);

      res.status(200).json({
        totalInscritos,
        totalEventos,
        eventosPorStatus,
        totalUsuariosAtivos,
        totalUsuarios,
        totalPromoters,
        promotersPendentes,
        promotersAprovados,
        locaisMaisPopulares,
        taxaAceitacao: {
          eventos: {
            aprovados: eventosAprovados,
            rejeitados: eventosRejeitados,
            taxaAprovacao: taxaAprovacaoEventos,
          },
          promoters: {
            aprovados: promotersAprovados,
            rejeitados: promotersRejeitadosCount,
            taxaAprovacao: taxaAprovacaoPromoters,
          },
        },
        eventosPorMes,
        inscricoesPorMes,
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      throw error;
    }
  }
}

// Função auxiliar para converter nome do mês em número (1-12)
function getMonthNumber(monthName: string): number {
  const months: { [key: string]: number } = {
    janeiro: 1,
    fevereiro: 2,
    março: 3,
    abril: 4,
    maio: 5,
    junho: 6,
    julho: 7,
    agosto: 8,
    setembro: 9,
    outubro: 10,
    novembro: 11,
    dezembro: 12,
  };
  return months[monthName.toLowerCase()] || 1;
}

export { AdminStatsController };

