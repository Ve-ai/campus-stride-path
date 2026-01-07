import jsPDF from 'jspdf';
import instituteLogo from "@/assets/logo-instituto-amor-de-deus.png";

const SCHOOL_NAME = "Instituto Amor de Deus";
const SCHOOL_SUBTITLE = "Sistema de Gestão Escolar";

/**
 * Adiciona o cabeçalho padrão com logotipo e nome da escola a todos os documentos PDF
 * @param doc - Instância do jsPDF
 * @param title - Título do documento
 * @param subtitle - Subtítulo opcional (ex: data, referência)
 * @returns Y position após o cabeçalho para continuar o conteúdo
 */
export const addPdfHeader = async (
  doc: jsPDF,
  title: string,
  subtitle?: string
): Promise<number> => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const isLandscape = pageWidth > doc.internal.pageSize.getHeight();
  
  // Carregar imagem do logotipo
  try {
    const logoImg = await loadImage(instituteLogo);
    const logoWidth = 40;
    const logoHeight = 40;
    const logoX = (pageWidth - logoWidth) / 2; // Centralizado
    const logoY = 15;
    
    doc.addImage(logoImg, 'PNG', logoX, logoY, logoWidth, logoHeight);
    
    // Nome da escola centralizado abaixo do logotipo
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(30, 64, 175); // Azul escuro
    doc.text(SCHOOL_NAME, pageWidth / 2, logoY + logoHeight + 12, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(SCHOOL_SUBTITLE, pageWidth / 2, logoY + logoHeight + 24, { align: 'center' });
    
    // Linha separadora
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(40, logoY + logoHeight + 35, pageWidth - 40, logoY + logoHeight + 35);
    
    // Título do documento
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(title, pageWidth / 2, logoY + logoHeight + 52, { align: 'center' });
    
    // Subtítulo (se fornecido)
    let nextY = logoY + logoHeight + 67;
    if (subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text(subtitle, pageWidth / 2, logoY + logoHeight + 67, { align: 'center' });
      nextY = logoY + logoHeight + 85;
    }
    
    return nextY;
  } catch (error) {
    console.error('Erro ao carregar logotipo:', error);
    // Fallback sem logotipo
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(30, 64, 175);
    doc.text(SCHOOL_NAME, pageWidth / 2, 30, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(SCHOOL_SUBTITLE, pageWidth / 2, 45, { align: 'center' });
    
    // Linha separadora
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(40, 55, pageWidth - 40, 55);
    
    // Título
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(title, pageWidth / 2, 75, { align: 'center' });
    
    let nextY = 90;
    if (subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text(subtitle, pageWidth / 2, 90, { align: 'center' });
      nextY = 110;
    }
    
    return nextY;
  }
};

/**
 * Versão síncrona do cabeçalho (para uso quando não é possível usar async)
 */
export const addPdfHeaderSync = (
  doc: jsPDF,
  title: string,
  subtitle?: string
): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Cabeçalho sem logotipo (para uso síncrono)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(30, 64, 175);
  doc.text(SCHOOL_NAME, pageWidth / 2, 30, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(SCHOOL_SUBTITLE, pageWidth / 2, 45, { align: 'center' });
  
  // Linha separadora
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(40, 55, pageWidth - 40, 55);
  
  // Título
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(title, pageWidth / 2, 75, { align: 'center' });
  
  let nextY = 90;
  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(subtitle, pageWidth / 2, 90, { align: 'center' });
    nextY = 110;
  }
  
  // Reset das cores
  doc.setTextColor(0, 0, 0);
  
  return nextY;
};

/**
 * Adiciona rodapé padrão em todas as páginas
 */
export const addPdfFooter = (doc: jsPDF, pageNumber?: number, totalPages?: number) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  
  // Data de geração
  const dateStr = new Date().toLocaleString('pt-AO');
  doc.text(`Gerado em: ${dateStr}`, 40, pageHeight - 20);
  
  // Número da página (se fornecido)
  if (pageNumber !== undefined && totalPages !== undefined) {
    doc.text(`Página ${pageNumber} de ${totalPages}`, pageWidth - 40, pageHeight - 20, { align: 'right' });
  }
  
  // Nome da escola
  doc.text(SCHOOL_NAME, pageWidth / 2, pageHeight - 20, { align: 'center' });
  
  // Reset das cores
  doc.setTextColor(0, 0, 0);
};

/**
 * Helper para carregar imagem como base64
 */
const loadImage = (src: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } else {
        reject(new Error('Canvas context not available'));
      }
    };
    img.onerror = reject;
    img.src = src;
  });
};

export { SCHOOL_NAME, SCHOOL_SUBTITLE };
