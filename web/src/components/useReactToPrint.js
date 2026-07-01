export function useReactToPrint({ contentRef }) {
  return () => {
    const content = contentRef.current
    if (!content) return
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const styles = content.querySelector('style')
    const styleContent = styles ? styles.innerHTML : ''
    const receiptHtml = content.innerHTML.replace(/<style>[\s\S]*?<\/style>/, '')

    printWindow.document.write(`
      <html>
      <head>
        <title>Reçu</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          html,
          body {
            min-height: 100%;
            margin: 0;
            background: #f8fafc;
          }
          body {
            display: flex;
            justify-content: center;
            align-items: flex-start;
            padding: 24px;
            box-sizing: border-box;
          }
          .print-shell {
            width: 80mm;
            max-width: 80mm;
            margin: 0 auto;
            background: #fff;
            box-shadow: 0 18px 40px rgba(15, 23, 42, 0.14);
          }
          ${styleContent}
          @media print {
            html,
            body {
              width: 80mm;
              min-height: 0;
              margin: 0 auto;
              padding: 0;
              background: #fff;
            }
            body {
              display: block;
            }
            .print-shell {
              width: 80mm;
              max-width: 80mm;
              margin: 0 auto;
              box-shadow: none;
            }
            .receipt {
              margin: 0 auto;
            }
          }
        </style>
      </head>
      <body>
        <main class="print-shell">
          ${receiptHtml}
        </main>
        <script>
          window.onload = function() {
            window.focus();
            window.print();
          }
        <\/script>
      </body>
      </html>
    `)
    printWindow.document.close()
  }
}
