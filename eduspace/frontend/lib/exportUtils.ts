// frontend/lib/exportUtils.ts

/**
 * 将数据导出为 CSV 文件并下载
 * @param data 要导出的对象数组
 * @param filename 导出的文件名
 * @param headers CSV 的表头数组
 */
export const exportToCSV = (data: any[], filename: string, headers: string[]) => {
    if (data.length === 0) {
      alert("当前没有可导出的数据");
      return;
    }
  
    // 1. 构造 CSV 内容
    const csvRows = [];
    
    // 添加表头
    csvRows.push(headers.join(','));
  
    // 添加数据行
    for (const row of data) {
      // 这里的 Object.values 会按顺序提取数据，
      // 注意：确保 handleExport 传进来的对象属性顺序与 headers 一致
      const values = Object.values(row).map(value => {
        // 处理包含逗号、换行符的字符串，防止 CSV 格式错乱
        const escaped = ('' + (value || '')).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }
  
    // 2. 创建 Blob 对象 (使用 \uFEFF UTF-8 带 BOM 格式，确保 Excel 打开中文不乱码)
    const csvString = '\uFEFF' + csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    
    // 3. 触发浏览器下载
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}_${new Date().toLocaleDateString()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };