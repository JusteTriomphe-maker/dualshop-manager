export function useReactToPrint({ contentRef }) {
  return () => {
    const content = contentRef.current
    if (!content) return
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const styles = content.querySelector('style')
    const styleContent = styles ? styles.innerHTML : ''

    printWindow.document.write(`
      <html>
      <head>
        <title>Reçu</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          @media print {
            html, body {
              width: 80mm;
              margin: 0;
              padding: 0;
              background: #fff;
            }
          }
          body {
            margin: 0;
            padding: 0;
            background: #fff;
          }
          ${styleContent}
        </style>
      </head>
      <body>
        ${content.innerHTML.replace(/<style>[\s\S]*?<\/style>/, '')}
        <script>
          window.onload = function() { window.print(); window.close(); }
        <\/script>
      </body>
      </html>
    `)
    printWindow.document.close()
  }
}
