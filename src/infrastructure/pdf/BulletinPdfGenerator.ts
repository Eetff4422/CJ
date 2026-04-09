import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { Bulletin } from '@domain/entities/Bulletin';
import { Citizen } from '@domain/entities/Citizen';
import { Conviction } from '@domain/entities/Conviction';

export interface BulletinPdfData {
  bulletin: Bulletin;
  citizen: Citizen;
  convictions: Conviction[]; // validated convictions only
  verificationUrl: string;
}

/**
 * Generates the official Bulletin n°3 PDF with a QR code for third-party verification.
 * Returns a Blob that can be downloaded or previewed.
 */
export class BulletinPdfGenerator {
  async generate(data: BulletinPdfData): Promise<Blob> {
    const { bulletin, citizen, convictions, verificationUrl } = data;

    const doc = new jsPDF({ format: 'a4', unit: 'mm' });
    const pageWidth = 210;
    const marginX = 20;

    // ---- Header ----
    doc.setFillColor(31, 56, 100); // gabon primary
    doc.rect(0, 0, pageWidth, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('RÉPUBLIQUE GABONAISE', pageWidth / 2, 12, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Ministère de la Justice', pageWidth / 2, 18, { align: 'center' });
    doc.text(
      'Service du Casier Judiciaire',
      pageWidth / 2,
      23,
      { align: 'center' }
    );
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(
      'BULLETIN N°3 DU CASIER JUDICIAIRE',
      pageWidth / 2,
      30,
      { align: 'center' }
    );

    // ---- Body ----
    doc.setTextColor(30, 30, 30);
    let y = 48;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`N° de demande : ${bulletin.requestNumber}`, marginX, y);
    doc.text(
      `Date d'édition : ${new Date().toLocaleDateString('fr-FR')}`,
      pageWidth - marginX,
      y,
      { align: 'right' }
    );
    y += 8;

    // Separator line
    doc.setDrawColor(46, 117, 182);
    doc.setLineWidth(0.5);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 8;

    // Identity block
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text("IDENTITÉ DU DEMANDEUR", marginX, y);
    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const rows: Array<[string, string]> = [
      ['Nom', citizen.lastName],
      ['Prénom', citizen.firstName],
      ['Sexe', citizen.gender === 'M' ? 'Masculin' : 'Féminin'],
      [
        'Date de naissance',
        new Date(citizen.birthDate).toLocaleDateString('fr-FR'),
      ],
      ['Lieu de naissance', citizen.birthPlace],
      ['Nom du père', citizen.fatherName],
      ['Nom de la mère', citizen.motherName],
      ['N° d\u2019identification', citizen.nationalId],
    ];
    rows.forEach(([label, value]) => {
      doc.setTextColor(100, 100, 100);
      doc.text(`${label} :`, marginX, y);
      doc.setTextColor(30, 30, 30);
      doc.setFont('helvetica', 'bold');
      doc.text(value, marginX + 50, y);
      doc.setFont('helvetica', 'normal');
      y += 6;
    });

    y += 4;
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 8;

    // Convictions block
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('CONDAMNATIONS', marginX, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    if (convictions.length === 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(46, 125, 50);
      doc.text('— NÉANT —', pageWidth / 2, y + 4, { align: 'center' });
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(
        "Aucune condamnation n'est inscrite au casier judiciaire de l'intéressé(e) à la date d'édition du présent bulletin.",
        pageWidth / 2,
        y + 12,
        { align: 'center', maxWidth: pageWidth - 2 * marginX }
      );
      y += 22;
    } else {
      doc.setTextColor(30, 30, 30);
      convictions.forEach((c, i) => {
        doc.setFont('helvetica', 'bold');
        doc.text(`${i + 1}. ${c.offense}`, marginX, y);
        y += 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`Juridiction : ${c.court}`, marginX + 5, y);
        y += 4;
        doc.text(
          `Date de décision : ${new Date(c.decisionDate).toLocaleDateString('fr-FR')}`,
          marginX + 5,
          y
        );
        y += 4;
        doc.text(`Peine : ${c.sentence}`, marginX + 5, y);
        y += 7;
        doc.setFontSize(10);
      });
    }

    // ---- QR code + verification footer ----
    y = 220;
    doc.setDrawColor(46, 117, 182);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 8;

    const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
      margin: 1,
      width: 200,
    });
    doc.addImage(qrDataUrl, 'PNG', pageWidth - marginX - 35, y, 35, 35);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(31, 56, 100);
    doc.text('VÉRIFICATION D\u2019AUTHENTICITÉ', marginX, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    const verifText =
      'Ce bulletin est doté d\u2019un QR Code unique. Tout tiers (employeur, administration, ambassade) peut scanner ce code pour confirmer instantanément l\u2019authenticité du document auprès du service émetteur.';
    doc.text(verifText, marginX, y + 11, { maxWidth: 120 });
    doc.setFont('helvetica', 'bold');
    doc.text(`Code : ${bulletin.verificationCode}`, marginX, y + 28);

    // Footer
    doc.setFillColor(240, 240, 240);
    doc.rect(0, 280, pageWidth, 17, 'F');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text(
      'Document généré par le Système de Gestion du Casier Judiciaire (SGCJ-Gabon)',
      pageWidth / 2,
      287,
      { align: 'center' }
    );
    doc.text(
      `République Gabonaise — Ministère de la Justice`,
      pageWidth / 2,
      292,
      { align: 'center' }
    );

    return doc.output('blob');
  }
}
