import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  X, 
  CheckCircle2, 
  Server, 
  Cpu, 
  ShieldCheck, 
  DollarSign, 
  Building, 
  Globe, 
  Database,
  Printer
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { printHtmlViaIframe } from '../utils/printHelper';

interface SystemReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemReportModal: React.FC<SystemReportModalProps> = ({ isOpen, onClose }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleDownloadPDF = async () => {
    try {
      setIsGenerating(true);
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Header Banner
      pdf.setFillColor(248, 250, 252);
      pdf.rect(10, 10, 190, 28, 'F');
      pdf.setDrawColor(226, 232, 240);
      pdf.rect(10, 10, 190, 28, 'S');

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.setTextColor(185, 28, 28);
      pdf.text("RELATÓRIO TÉCNICO & FINANCEIRO OFICIAL", 14, 20);
      
      pdf.setFontSize(10);
      pdf.setTextColor(30, 41, 59);
      pdf.text("Sistema de Acolhimento & Gestão • Ministério Integrarte (AD Leiria)", 14, 26);
      
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);
      pdf.setFont("helvetica", "normal");
      pdf.text("Data de Emissão: 17 de Setembro de 2026 | Estado: Operacional & Verificado", 14, 32);
      
      let y = 46;
      const addHeading = (text: string) => {
        if (y > 265) { 
          pdf.addPage(); 
          y = 20; 
        }
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11);
        pdf.setTextColor(15, 23, 42);
        pdf.text(text, 14, y);
        y += 6;
      };

      const addParagraph = (text: string) => {
        if (y > 265) { 
          pdf.addPage(); 
          y = 20; 
        }
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.setTextColor(51, 65, 85);
        const splitText = pdf.splitTextToSize(text, 180);
        pdf.text(splitText, 14, y);
        y += (splitText.length * 4.5) + 4;
      };

      addHeading("1. Resumo Executivo & Propósito");
      addParagraph("A aplicação Ficha de Registo de Visitantes e Gestão (Ministério Integrarte - AD Leiria) é uma solução digital desenvolvida para modernizar o acolhimento de visitantes, novos convertidos e membros da igreja, automatizando fichas, acompanhamento pastoral e envio de mensagens.");

      addHeading("2. Funcionalidades Principais Implementadas");
      addParagraph("• Ficha de Registo Digital com Assinatura Tátil integrada no ecrã.\n• Banco de Registos com pesquisa dinâmica, paginação e exportação para CSV/Excel.\n• Hub de QR Code dinâmico para projeção em cultos e cartazes.\n• Sistema de Envio Automático de Boas-Vindas e Versículos (WhatsApp e E-mail).\n• Estatísticas pastorais e gráficos analíticos de crescimento.\n• Controlo de acessos RBAC (Administrador/Pastor) e sincronização Cloud Firestore.");

      addHeading("3. Análise de Custos de Desenvolvimento (Referência de Mercado)");
      addParagraph("• UI/UX Design e Prototipagem Responsiva: 1.500 € (30h)\n• Frontend React 19, Tailwind CSS e Componentes: 3.000 € (60h)\n• Arquitetura Backend & Cloud Firestore: 2.100 € (35h)\n• Integração Multi-Gateway WhatsApp & Webhooks: 1.500 € (25h)\nTotal Estimado de Mercado: 8.100 € + IVA");

      addHeading("4. Custos Operacionais & Manutenção Contínua");
      addParagraph("• Domínio & Alojamento Cloud: ~15 € / ano (Google Cloud / Firebase / Domínio .pt ou .com)\n• Gateway WhatsApp Profissional (Plano Pago): 25 € a 39 € / mês (API dedicada para disparos automáticos e ilimitados)\n• Manutenção, Backups & Suporte Técnico Dev: 50 € / mês (gestão do banco de dados, backups em nuvem, segurança e suporte contínuo)");

      addHeading("5. Modalidades de Contratação e Licenciamento");
      addParagraph("OPÇÃO A — Aquisição Definitiva da Licença:\n• Pagamento Único: 8.100 € (Propriedade total da aplicação e código-fonte, com taxa opcional de 50 €/mês para manutenção e gestão de dados pelo programador).\n\nOPÇÃO B — Aluguer Mensal (Modelo SaaS / Chave na Mão):\n• Mensalidade: 120 € / mês (Sem investimento inicial de desenvolvimento; inclui alojamento cloud, base de dados segura, domínio, suporte contínuo e atualizações do programador).");

      // Footer
      pdf.setDrawColor(226, 232, 240);
      pdf.line(14, 280, 196, 280);
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.text("Ministério Integrarte • Assembleia de Deus de Leiria • Relatório Confidencial", 14, 286);

      pdf.save("relatorio-tecnico-financeiro-ad-leiria.pdf");
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      alert('Ocorreu um erro ao gerar o PDF. Pode utilizar a opção de imprimir.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    const el = document.getElementById('official-system-report-content');
    if (el) {
      printHtmlViaIframe(el.innerHTML, 'Relatorio_Tecnico_Financeiro_AD_Leiria');
    } else {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-slate-200">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white font-bold shadow-md">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                Relatório Técnico & Financeiro Oficial
              </h2>
              <p className="text-xs text-slate-400">
                Ficha de Registo & Gestão • Ministério Integrarte (AD Leiria)
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="px-3.5 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isGenerating ? 'A gerar PDF...' : 'Descarregar PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors"
              title="Imprimir Relatório"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body (Scrollable Report Preview) */}
        <div className="p-4 sm:p-8 overflow-y-auto bg-slate-50 flex-1">
          <div 
            id="official-system-report-content" 
            className="bg-white p-6 sm:p-12 rounded-2xl shadow-sm border border-slate-200 max-w-4xl mx-auto text-slate-800 font-sans space-y-8"
          >
            {/* Header Documento */}
            <div className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-[11px] font-black uppercase tracking-widest text-red-600 bg-red-50 px-3 py-1 rounded-full">
                  Documento Oficial de Auditoria & Custos
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                  Sistema de Acolhimento & Gestão AD Leiria
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Especificação Funcional, Arquitetura Técnica e Análise Financeira Completa
                </p>
              </div>
              <div className="text-right sm:border-l sm:border-slate-200 sm:pl-6">
                <div className="text-xs font-bold text-slate-500">Data de Emissão:</div>
                <div className="text-sm font-black text-slate-800">17 de Setembro de 2026</div>
                <div className="text-xs text-emerald-600 font-bold mt-1">Status: Operacional & Verificado</div>
              </div>
            </div>

            {/* Secção 1: Resumo do Programa */}
            <section className="space-y-3">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <CheckCircle2 className="w-5 h-5 text-red-600" />
                1. Resumo Executivo & Propósito
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                A aplicação <strong>Ficha de Registo de Visitantes e Gestão (Ministério Integrarte - AD Leiria)</strong> é uma solução digital de alta performance desenvolvida para modernizar o acolhimento de visitantes, novos convertidos e membros. Substitui os tradicionais boletins de papel por uma ficha digital acessível via telemóvel através de QR Code ou link direto, automatizando o acompanhamento pastoral, o envio de versículos bíblicos e a gestão estatística da igreja.
              </p>
            </section>

            {/* Secção 2: Funcionalidades Detalhadas */}
            <section className="space-y-4">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Cpu className="w-5 h-5 text-red-600" />
                2. Detalhe Completo das Funcionalidades
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <h3 className="font-bold text-sm text-slate-900">📝 Ficha de Registo Digital & Assinatura</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Formulário interativo com recolha de dados pessoais, contactos, morada, preferências de batismo, pedidos de oração e integração com bloco de assinatura tátil digital.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <h3 className="font-bold text-sm text-slate-900">📊 Banco de Registos & Filtros Avançados</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Lista completa com pesquisa em tempo real, filtros por status (visitante, batizado, membro), exportação para CSV/Excel e impressão individual de fichas formatadas.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <h3 className="font-bold text-sm text-slate-900">📲 Hub de QR Code & Partilha Rápida</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Geração dinâmica de QR Codes customizados para projeção em cultos, cartazes de acolhimento e partilha instantânea via link otimizado.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <h3 className="font-bold text-sm text-slate-900">🕊️ Agendamento e Envio Automático</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Sistema de envio de versículos e mensagens de boas-vindas via WhatsApp e E-mail, compatível com Webhooks (Make.com, UltraMsg, Evolution API, Z-API) e envio direto.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <h3 className="font-bold text-sm text-slate-900">📈 Estatísticas & Gráficos Interativos</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Painel analítico alimentado por gráficos (Recharts) que monitoriza o crescimento de visitantes, distribuição demográfica e rácio de integração ministerial.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <h3 className="font-bold text-sm text-slate-900">🔐 Segurança & Controlo RBAC</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Controlo de acessos baseado em papéis (Administradores e Pastores), autenticação segura e sincronização em tempo real com base de dados cloud (Firebase Firestore).
                  </p>
                </div>
              </div>
            </section>

            {/* Secção 3: Análise de Custos de Desenvolvimento */}
            <section className="space-y-4">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <DollarSign className="w-5 h-5 text-red-600" />
                3. Custos de Desenvolvimento (Comparativo de Mercado)
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Para dimensionar o valor de mercado deste software, tomamos como referência agências de desenvolvimento web e consultorias de TI de médio porte em Portugal e na União Europeia.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 uppercase font-black">
                      <th className="p-3 border border-slate-200">Componente de Desenvolvimento</th>
                      <th className="p-3 border border-slate-200">Horas Estimadas</th>
                      <th className="p-3 border border-slate-200">Custo Médio Agência (PT / EU)</th>
                      <th className="p-3 border border-slate-200">Valor Real na Solução AD Leiria</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    <tr>
                      <td className="p-3 border border-slate-200 font-bold">Arquitetura UI/UX & Design Responsivo</td>
                      <td className="p-3 border border-slate-200">30h</td>
                      <td className="p-3 border border-slate-200">1.500 € (50€/h)</td>
                      <td className="p-3 border border-slate-200 text-emerald-700 font-bold">Incluído / Otimizado</td>
                    </tr>
                    <tr>
                      <td className="p-3 border border-slate-200 font-bold">Frontend (React 19, Tailwind CSS, Lucide, Motion)</td>
                      <td className="p-3 border border-slate-200">60h</td>
                      <td className="p-3 border border-slate-200">3.000 € (50€/h)</td>
                      <td className="p-3 border border-slate-200 text-emerald-700 font-bold">Incluído / Otimizado</td>
                    </tr>
                    <tr>
                      <td className="p-3 border border-slate-200 font-bold">Backend & Sincronização Cloud (Firebase Firestore)</td>
                      <td className="p-3 border border-slate-200">35h</td>
                      <td className="p-3 border border-slate-200">2.100 € (60€/h)</td>
                      <td className="p-3 border border-slate-200 text-emerald-700 font-bold">Incluído / Otimizado</td>
                    </tr>
                    <tr>
                      <td className="p-3 border border-slate-200 font-bold">Integração Multi-Gateway WhatsApp & Webhooks Make</td>
                      <td className="p-3 border border-slate-200">25h</td>
                      <td className="p-3 border border-slate-200">1.500 € (60€/h)</td>
                      <td className="p-3 border border-slate-200 text-emerald-700 font-bold">Incluído / Otimizado</td>
                    </tr>
                    <tr className="bg-slate-50 font-black">
                      <td className="p-3 border border-slate-200">TOTAL ESTIMADO DE MERCADO</td>
                      <td className="p-3 border border-slate-200">150 Horas</td>
                      <td className="p-3 border border-slate-200 text-red-600">8.100 € + IVA</td>
                      <td className="p-3 border border-slate-200 text-emerald-700">Desenvolvido sob medida</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Secção 4: Custos de Hospedagem, Domínio e Operação */}
            <section className="space-y-4">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Globe className="w-5 h-5 text-red-600" />
                4. Custos Operacionais, Hospedagem e WhatsApp
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Para manter a aplicação em pleno funcionamento e garantir envios profissionais automatizados, detalham-se os custos correntes estimados:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="text-xs font-bold text-red-600 uppercase tracking-wider">Domínio & Alojamento Cloud</div>
                  <div className="text-lg font-black text-slate-900">15€ <span className="text-xs font-normal text-slate-500">/ ano</span></div>
                  <p className="text-xs text-slate-600">
                    Registo de domínio dedicado e servidor cloud seguro (Google Cloud / Firebase).
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="text-xs font-bold text-red-600 uppercase tracking-wider">Gateway WhatsApp Pago</div>
                  <div className="text-lg font-black text-slate-900">25€ - 39€ <span className="text-xs font-normal text-slate-500">/ mês</span></div>
                  <p className="text-xs text-slate-600">
                    Plano profissional de API (ex: UltraMsg ou Z-API) para disparos automáticos e ilimitados.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="text-xs font-bold text-red-600 uppercase tracking-wider">Manutenção & Suporte Dev</div>
                  <div className="text-lg font-black text-slate-900">50€ <span className="text-xs font-normal text-slate-500">/ mês</span></div>
                  <p className="text-xs text-slate-600">
                    Gestão técnica do banco de dados, backups em nuvem, atualizações e suporte contínuo pelo programador.
                  </p>
                </div>
              </div>
            </section>

            {/* Secção 5: Modalidades de Licenciamento */}
            <section className="space-y-4">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <DollarSign className="w-5 h-5 text-red-600" />
                5. Modalidades Comerciais (Aquisição vs Aluguer)
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                A solução é disponibilizada em duas modalidades de investimento à escolha da instituição:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Opção A: Aquisição */}
                <div className="p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-500 space-y-3 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl">
                    Propriedade Total
                  </div>
                  <h3 className="text-base font-black text-emerald-900">Opção A: Aquisição Definitiva da Licença</h3>
                  <div className="text-2xl font-black text-emerald-950">
                    8.100 € <span className="text-xs font-normal text-emerald-800">(Pagamento Único)</span>
                  </div>
                  <ul className="text-xs text-emerald-900 space-y-1.5 pl-4 list-disc">
                    <li>Transferência integral dos direitos de código-fonte e gestão.</li>
                    <li>Configuração inicial completa na cloud da igreja.</li>
                    <li>Opção de contrato de manutenção mensal com o programador (50€/mês).</li>
                  </ul>
                </div>

                {/* Opção B: Aluguer */}
                <div className="p-5 rounded-2xl bg-indigo-50 border-2 border-indigo-500 space-y-3 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl">
                    Chave na Mão
                  </div>
                  <h3 className="text-base font-black text-indigo-900">Opção B: Aluguer Mensal (SaaS)</h3>
                  <div className="text-2xl font-black text-indigo-950">
                    120 € <span className="text-xs font-normal text-indigo-800">/ mês</span>
                  </div>
                  <ul className="text-xs text-indigo-900 space-y-1.5 pl-4 list-disc">
                    <li><strong>Sem investimento inicial elevado</strong> (0€ de custo de desenvolvimento).</li>
                    <li>Inclui hospedagem, base de dados segura, domínio e suporte do programador.</li>
                    <li>Atualizações contínuas de novas funcionalidades.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Secção 5: Conclusão */}
            <section className="space-y-3 bg-red-50 p-6 rounded-2xl border border-red-100">
              <h2 className="text-base font-black text-red-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-red-600" />
                5. Conclusão & Retorno Operacional
              </h2>
              <p className="text-xs sm:text-sm text-red-950 leading-relaxed">
                A aplicação representa um ativo tecnológico de elevado valor estratégico para o Ministério Integrarte da AD Leiria. Com um custo de desenvolvimento avaliado em cerca de <strong>8.100 €</strong> em termos de mercado corporativo, a sua manutenção operacional anual resume-se exclusivamente ao custo simbólico do domínio (aprox. 12€/ano), sendo a infraestrutura de dados suportada na nuvem de forma altamente fiável e segura.
              </p>
            </section>

            {/* Rodapé do Relatório */}
            <div className="border-t border-slate-200 pt-6 flex justify-between items-center text-xs text-slate-400">
              <div>Ministério Integrarte • Assembleia de Deus de Leiria</div>
              <div>Relatório Gerado por IA • Confidencial</div>
            </div>

          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Pode descarregar este relatório em formato PDF oficial a qualquer momento.
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isGenerating ? 'A gerar PDF...' : 'Descarregar Relatório PDF'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
