import { BibleVerse, RegistrationRecord, ScheduledDispatch } from '../types';

export const INITIAL_VERSES: BibleVerse[] = [
  {
    id: 'msg-1-acolhimento',
    referencia: '1. Acolhimento - Boas-Vindas à AD Leiria',
    livro: 'Mensagem Pastoral',
    capitulo: 1,
    versiculo: '1',
    texto: `Olá {nome},

Foi uma alegria receber a sua presença na AD Leiria.

Oramos para que tenha sentido o amor de Deus e o cuidado da nossa família.

Se desejar partilhar um pedido de oração, teremos prazer em orar por si.

_“A oração feita por um justo pode muito em seus efeitos.” – Tiago 5:16_


*Bruno Malheiro*
Pastor`,
    categoria: '1 Acolhimento',
    tipo: 'mensagem',
  },
  {
    id: 'msg-2-cuidado',
    referencia: '2. Cuidado e Encorajamento - Semana Abençoada',
    livro: 'Mensagem Pastoral',
    capitulo: 1,
    versiculo: '1',
    texto: `Passamos para desejar um restante de semana abençoada.
Que o Senhor fortaleça o seu coração e renove as suas forças.
Estamos aqui para caminhar consigo.

*_AD Leiria_*
“Na família AD Leiria, nós celebramos, nós cuidamos e nós crescemos.”`,
    categoria: '2 Cuidado e Encorajamento',
    tipo: 'mensagem',
  },
  {
    id: 'msg-3-regressar',
    referencia: '3. Convite para Regressar - Próximas Celebrações',
    livro: 'Mensagem Pastoral',
    capitulo: 1,
    versiculo: '1',
    texto: `Boa tarde, muita paz

Nesta sexta-feira às 21h, e neste domingo teremos celebração às 10h e às 17h.
Será uma alegria revê-lo(a).

_*Na família AD Leiria, nós celebramos, nós cuidamos e nós crescemos.*_`,
    categoria: '3 Convite para Regressar',
    tipo: 'mensagem',
  },
  {
    id: 'msg-4-cafe',
    referencia: '4. Convite ao Café com o Pastor - Inscrição & Confirmação',
    livro: 'Mensagem Pastoral',
    capitulo: 1,
    versiculo: '1',
    texto: `Olá {nome},

Queremos convidá-lo(a) para o 
Café com o Pastor,
Será um momento simples e 
especial para conhecer melhor 
a visão da igreja, partilhar e criar 
vínculos.
Teremos muita alegria em
recebê-lo(a).
00-00-2026
08h00

confirme sua presença no link abaixo, até o dia 00d00:
https://forms.gle/ADLeiriaCafeComPastor`,
    categoria: '4 Convite ao Café com o Pastor',
    tipo: 'mensagem',
  },
];

export const INITIAL_RECORDS: RegistrationRecord[] = [];

export const INITIAL_SCHEDULES: ScheduledDispatch[] = [];

export const DEFAULT_WHATSAPP_TEMPLATE = `Olá {nome},

Foi uma alegria receber a sua presença na AD Leiria.

Oramos para que tenha sentido o amor de Deus e o cuidado da nossa família.

Se desejar partilhar um pedido de oração, teremos prazer em orar por si.

_“A oração feita por um justo pode muito em seus efeitos.” – Tiago 5:16_


*Bruno Malheiro*
Pastor`;

export const DEFAULT_EMAIL_TEMPLATE = `Olá {nome},

Foi uma alegria receber a sua presença na AD Leiria.

Oramos para que tenha sentido o amor de Deus e o cuidado da nossa família.

Se desejar partilhar um pedido de oração, teremos prazer em orar por si.

_“A oração feita por um justo pode muito em seus efeitos.” – Tiago 5:16_


*Bruno Malheiro*
Pastor`;
