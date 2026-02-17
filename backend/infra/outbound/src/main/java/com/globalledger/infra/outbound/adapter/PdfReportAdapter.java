package com.globalledger.infra.outbound.adapter;

import com.globalledger.domain.port.output.PdfGeneratorPort;
import com.globalledger.domain.vo.AccountSummary;
import com.globalledger.domain.vo.MonthlyReportData;
import com.globalledger.domain.vo.ReportBudgetSummary;
import com.globalledger.domain.vo.TransactionSummary;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class PdfReportAdapter implements PdfGeneratorPort {

    private static final Font TITLE_FONT = new Font(Font.HELVETICA, 18, Font.BOLD);
    private static final Font HEADER_FONT = new Font(Font.HELVETICA, 12, Font.BOLD);
    private static final Font NORMAL_FONT = new Font(Font.HELVETICA, 10, Font.NORMAL);
    private static final Font SMALL_FONT = new Font(Font.HELVETICA, 8, Font.NORMAL);

    @Override
    public byte[] generateMonthlyReport(UUID userId, YearMonth yearMonth) {
        throw new UnsupportedOperationException("Use generateMonthlyReport with MonthlyReportData");
    }

    public byte[] generateMonthlyReport(MonthlyReportData data) {
        try (ByteArrayOutputStream os = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 54, 36);
            PdfWriter.getInstance(document, os);
            document.open();

            addHeader(document, data.period());
            addSummarySection(document, data.totalAssetsKrw());
            document.add(Chunk.NEWLINE);
            addAccountSummaryTable(document, data.accounts());
            document.add(Chunk.NEWLINE);

            if (data.budgetSummary() != null) {
                addBudgetSection(document, data.budgetSummary());
                document.add(Chunk.NEWLINE);
            }

            if (data.transactions() != null && !data.transactions().isEmpty()) {
                addTransactionSection(document, data.transactions());
            }

            addFooter(document);

            document.close();
            log.info("PDF report generated successfully for period: {}", data.period());
            return os.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate PDF report", e);
            throw new RuntimeException("PDF 생성 실패", e);
        }
    }

    private void addHeader(Document doc, YearMonth period) throws DocumentException {
        Paragraph title = new Paragraph(
                period.format(DateTimeFormatter.ofPattern("yyyy년 MM월")) + " 자산 리포트",
                TITLE_FONT
        );
        title.setAlignment(Element.ALIGN_CENTER);
        doc.add(title);
        doc.add(Chunk.NEWLINE);
    }

    private void addSummarySection(Document doc, BigDecimal totalAssetsKrw) throws DocumentException {
        Paragraph summary = new Paragraph("총 자산 (KRW 환산): " + formatAmount(totalAssetsKrw) + " 원", HEADER_FONT);
        summary.setAlignment(Element.ALIGN_LEFT);
        doc.add(summary);
    }

    private void addAccountSummaryTable(Document doc, List<AccountSummary> accounts) throws DocumentException {
        Paragraph sectionTitle = new Paragraph("계좌별 자산 현황", HEADER_FONT);
        doc.add(sectionTitle);
        doc.add(new Paragraph(" ", SMALL_FONT));

        PdfPTable table = new PdfPTable(7);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{1.5f, 1.5f, 1.5f, 1.5f, 1.5f, 1.5f, 1.5f});

        addTableHeaderCell(table, "계좌명");
        addTableHeaderCell(table, "통화");
        addTableHeaderCell(table, "잔액");
        addTableHeaderCell(table, "평단가");
        addTableHeaderCell(table, "현재환율");
        addTableHeaderCell(table, "평가손익");
        addTableHeaderCell(table, "손익률(%)");

        for (AccountSummary account : accounts) {
            addTableCell(table, account.accountName());
            addTableCell(table, account.currency().name());
            addTableCell(table, formatAmount(account.balance()));
            addTableCell(table, formatRate(account.averageRate()));
            addTableCell(table, formatRate(account.currentRate()));
            addPnlCell(table, account.unrealizedPnl());
            addPercentCell(table, account.unrealizedPnlPercent());
        }

        doc.add(table);
    }

    private void addBudgetSection(Document doc, ReportBudgetSummary budget) throws DocumentException {
        Paragraph sectionTitle = new Paragraph("예산 현황", HEADER_FONT);
        doc.add(sectionTitle);
        doc.add(new Paragraph(" ", SMALL_FONT));

        PdfPTable table = new PdfPTable(5);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{1.5f, 1.5f, 1.5f, 1.5f, 1.5f});

        addTableHeaderCell(table, "통화");
        addTableHeaderCell(table, "예산");
        addTableHeaderCell(table, "지출");
        addTableHeaderCell(table, "잔여");
        addTableHeaderCell(table, "진행률(%)");

        addTableCell(table, budget.currency().name());
        addTableCell(table, formatAmount(budget.budgetAmount()));
        addTableCell(table, formatAmount(budget.spentAmount()));
        addTableCell(table, formatAmount(budget.remainingAmount()));
        addPercentCell(table, budget.budgetProgressRate());

        doc.add(table);
    }

    private void addTransactionSection(Document doc, List<TransactionSummary> transactions) throws DocumentException {
        Paragraph sectionTitle = new Paragraph("거래 내역 (최근 20건)", HEADER_FONT);
        doc.add(sectionTitle);
        doc.add(new Paragraph(" ", SMALL_FONT));

        PdfPTable table = new PdfPTable(5);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{1.5f, 1.5f, 1.5f, 2f, 2.5f});

        addTableHeaderCell(table, "날짜");
        addTableHeaderCell(table, "유형");
        addTableHeaderCell(table, "금액");
        addTableHeaderCell(table, "카테고리");
        addTableHeaderCell(table, "설명");

        int count = Math.min(transactions.size(), 20);
        for (int i = 0; i < count; i++) {
            TransactionSummary tx = transactions.get(i);
            addTableCell(table, tx.date().toString());
            addTableCell(table, tx.type().name());
            addTableCell(table, formatAmount(tx.amount()) + " " + tx.currency().name());
            addTableCell(table, tx.categoryName());
            addTableCell(table, tx.description() != null ? tx.description() : "-");
        }

        doc.add(table);
    }

    private void addFooter(Document doc) throws DocumentException {
        doc.add(Chunk.NEWLINE);
        Paragraph footer = new Paragraph("Generated by Global Ledger", SMALL_FONT);
        footer.setAlignment(Element.ALIGN_RIGHT);
        doc.add(footer);
    }

    private void addTableHeaderCell(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, HEADER_FONT));
        cell.setBackgroundColor(new Color(230, 230, 230));
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setPadding(5);
        table.addCell(cell);
    }

    private void addTableCell(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, NORMAL_FONT));
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setPadding(4);
        table.addCell(cell);
    }

    private void addPnlCell(PdfPTable table, BigDecimal pnl) {
        String text = formatAmount(pnl);
        PdfPCell cell = new PdfPCell(new Phrase(text, NORMAL_FONT));
        cell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        cell.setPadding(4);

        if (pnl.compareTo(BigDecimal.ZERO) > 0) {
            cell.setBackgroundColor(new Color(220, 255, 220));
        } else if (pnl.compareTo(BigDecimal.ZERO) < 0) {
            cell.setBackgroundColor(new Color(255, 220, 220));
        }

        table.addCell(cell);
    }

    private void addPercentCell(PdfPTable table, BigDecimal percent) {
        String text = percent.toPlainString() + "%";
        PdfPCell cell = new PdfPCell(new Phrase(text, NORMAL_FONT));
        cell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        cell.setPadding(4);

        if (percent.compareTo(BigDecimal.ZERO) > 0) {
            cell.setBackgroundColor(new Color(220, 255, 220));
        } else if (percent.compareTo(BigDecimal.ZERO) < 0) {
            cell.setBackgroundColor(new Color(255, 220, 220));
        }

        table.addCell(cell);
    }

    private String formatAmount(BigDecimal amount) {
        if (amount == null) {
            return "0.00";
        }
        return String.format("%,.2f", amount);
    }

    private String formatRate(BigDecimal rate) {
        if (rate == null || rate.compareTo(BigDecimal.ZERO) == 0) {
            return "-";
        }
        return String.format("%.4f", rate);
    }
}
