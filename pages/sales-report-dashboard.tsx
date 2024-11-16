import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, DollarSign, RefreshCcw, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Papa from 'papaparse';

// ... (все интерфейсы остаются теми же) ...
// Тстовые данные

interface Product {

  id: string;

  name: string;

  quantity: number;

  price: number;

  total: number;

  type: 'sale' | 'cancellation' | 'return';

}



interface Receipt {

  id: string;

  time: string;

  amount: number;

  type: 'sale' | 'cancellation' | 'return';

  products: Product[];

}


interface DayData {

  sales: number;

  cancellations: number;

  returns: number;

  receipts: Receipt[];

}


interface CashierData {

  sales: number;

  cancellations: number;

  returns: number;

  days: { [key: string]: DayData };

}



interface MonthData {

  cashiers: { [key: string]: CashierData };

}



interface SalesData {

  months: { [key: string]: MonthData };

}

// Добавляем интерфейс для данных из CSV
interface CsvRow {
  CASHIER: string;
  TRANZDATE: string;
  CHEQUENUMBER: string;
  STATE: string;
  ChequeType: string;
  TRANZTIME: string;
  TRANZTYPE: string;
  ORDERPOS: string;
  CODE: string;
  NAME: string;
  PRICE: string;
  QUANTITY: string;
  SUMM: string;
  SUMMDISCPOS: string;
}

// Функция для преобразования данных CSV в формат SalesData
const convertCsvToSalesData = (csvData: CsvRow[]): SalesData => {
  const salesData: SalesData = { months: {} };

  const parseRussianDate = (dateStr: string) => {
    const [day, month, year] = dateStr.split('.').map(Number);
    return new Date(year, month - 1, day);
  };

  const parseRussianNumber = (numStr: string) => {
    return parseFloat(numStr.replace(/\s/g, '').replace(',', '.'));
  };

  csvData.forEach(row => {
    // Пропускаем пустые строки или строки с неполными данными
    if (!row.TRANZDATE || !row.CASHIER) return;

    const date = parseRussianDate(row.TRANZDATE);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const dayKey = row.TRANZDATE;
    const cashier = row.CASHIER.trim();
    
    // Определяем тип операции
    let operationType: 'sale' | 'cancellation' | 'return';
    if (row.TRANZTYPE === '12') {
      operationType = 'cancellation';
    } else if (row.ChequeType === '1') {
      operationType = 'return';
    } else if (row.ChequeType === '4' || row.ChequeType === '5') {
      // Пропускаем внесения и выплаты
      return;
    } else {
      operationType = 'sale';
    }

    // Инициализируем структуру данных
    if (!salesData.months[monthKey]) {
      salesData.months[monthKey] = { cashiers: {} };
    }
    if (!salesData.months[monthKey].cashiers[cashier]) {
      salesData.months[monthKey].cashiers[cashier] = {
        sales: 0,
        cancellations: 0,
        returns: 0,
        days: {}
      };
    }
    if (!salesData.months[monthKey].cashiers[cashier].days[dayKey]) {
      salesData.months[monthKey].cashiers[cashier].days[dayKey] = {
        sales: 0,
        cancellations: 0,
        returns: 0,
        receipts: []
      };
    }

    // Добавляем продукт в соответствующий чек
    const amount = parseRussianNumber(row.SUMM);
    const price = row.PRICE ? parseRussianNumber(row.PRICE) : 0;
    const quantity = row.QUANTITY ? parseRussianNumber(row.QUANTITY) : 0;

    const receipt = {
      id: row.CHEQUENUMBER,
      time: row.TRANZTIME,
      amount: amount,
      type: operationType,
      products: [{
        id: row.CODE || 'NO_CODE',
        name: row.NAME || 'Без наименования',
        quantity: quantity,
        price: price,
        total: amount,
        type: operationType
      }]
    };

    // Обновляем суммы
    if (operationType === 'sale') {
      salesData.months[monthKey].cashiers[cashier].sales += amount;
      salesData.months[monthKey].cashiers[cashier].days[dayKey].sales += amount;
    } else if (operationType === 'cancellation') {
      salesData.months[monthKey].cashiers[cashier].cancellations += amount;
      salesData.months[monthKey].cashiers[cashier].days[dayKey].cancellations += amount;
    } else {
      salesData.months[monthKey].cashiers[cashier].returns += amount;
      salesData.months[monthKey].cashiers[cashier].days[dayKey].returns += amount;
    }

    // Добавляем чек в день
    const existingReceipt = salesData.months[monthKey].cashiers[cashier].days[dayKey].receipts
      .find(r => r.id === receipt.id);
    
    if (existingReceipt) {
      existingReceipt.products.push(...receipt.products);
    } else {
      salesData.months[monthKey].cashiers[cashier].days[dayKey].receipts.push(receipt);
    }
  });

  return salesData;
};

export default function SalesReportDashboard() {

  const [expandedMonths, setExpandedMonths] = useState<string[]>([]);

  const [expandedCashiers, setExpandedCashiers] = useState<string[]>([]);

  const [expandedDays, setExpandedDays] = useState<string[]>([]);

  const [expandedReceipts, setExpandedReceipts] = useState<string[]>([]);

  const [salesData, setSalesData] = useState<SalesData | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/reports2.csv');
        const csvText = await response.text();
        
        Papa.parse<CsvRow>(csvText, {
          header: true,
          delimiter: '\t',
          skipEmptyLines: true,
          complete: (results) => {
            const convertedData = convertCsvToSalesData(results.data as CsvRow[]);
            setSalesData(convertedData);
          },
          error: (error: Error) => {
            console.error('Ошибка парсинга CSV:', error);
          }
        });
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
      }
    };

    loadData();
  }, []);

  const toggleMonth = (month: string) => {

    setExpandedMonths(prev => 

      prev.includes(month) ? prev.filter(m => m !== month) : [...prev, month]

    );

  };

  const toggleCashier = (cashierId: string) => {

    setExpandedCashiers(prev => 

      prev.includes(cashierId) ? prev.filter(c => c !== cashierId) : [...prev, cashierId]

    );

  };



  const toggleDay = (day: string) => {

    setExpandedDays(prev => 

      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]

    );

  };



  const toggleReceipt = (receiptId: string) => {

    setExpandedReceipts(prev => 

      prev.includes(receiptId) ? prev.filter(r => r !== receiptId) : [...prev, receiptId]

    );

  };



  const getReceiptType = (type: 'sale' | 'cancellation' | 'return') => {

    switch (type) {

      case 'sale': return 'Продажа';

      case 'cancellation': return 'Сторно';

      case 'return': return 'Возврат';

      default: return 'Продажа';

    }

  };



  const getProductOperationType = (type: 'sale' | 'cancellation' | 'return') => {

    switch (type) {

      case 'sale': return 'Продажа';

      case 'cancellation': return 'Сторно';

      case 'return': return 'Возврат';

    }

  };



  // Функция для подсчёта сумм по продуктам

  const calculateTotals = (products: Product[]) => {

    return products.reduce((totals, product) => {

      if (product.type === 'sale') {

        totals.sales += product.total;

      } else if (product.type === 'cancellation') {

        totals.cancellations += product.total;

      } else if (product.type === 'return') {

        totals.returns += product.total;

      }

      return totals;

    }, { sales: 0, cancellations: 0, returns: 0 });

  };



  // Функция для подсчёта сумм по чекам

  const calculateReceiptTotals = (receipts: Receipt[]) => {

    return receipts.reduce((totals, receipt) => {

      const receiptTotals = calculateTotals(receipt.products);

      totals.sales += receiptTotals.sales;

      totals.cancellations += receiptTotals.cancellations;

      totals.returns += receiptTotals.returns;

      return totals;

    }, { sales: 0, cancellations: 0, returns: 0 });

  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB'
    }).format(amount);
  };

  const renderMetricCard = (title: string, amount: number, icon: React.ReactNode, colorClass: string) => (
    <Card className="bg-white">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className={`rounded-full p-3 ${colorClass} bg-opacity-10`}>
            {icon}
          </div>
        </div>
        <h3 className="mt-4 text-lg font-medium text-gray-600">{title}</h3>
        <p className={`mt-2 text-2xl font-bold ${colorClass}`}>
          {formatMoney(amount)}
        </p>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {salesData ? (
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Отчет по продажам</h1>
            <p className="mt-2 text-gray-600">Детальная стасисика по операциям</p>
          </div>

          {Object.entries(salesData.months).map(([monthKey, monthData]) => {
            const allReceipts = Object.values(monthData.cashiers).flatMap(cashier => 
              Object.values(cashier.days).flatMap(day => day.receipts)
            );
            const monthTotals = calculateReceiptTotals(allReceipts);

            return (
              <div key={monthKey} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  {renderMetricCard(
                    "Продажи",
                    monthTotals.sales,
                    <DollarSign className="w-6 h-6 text-green-600" />,
                    "text-green-600"
                  )}
                  {renderMetricCard(
                    "Сторно",
                    monthTotals.cancellations,
                    <XCircle className="w-6 h-6 text-red-600" />,
                    "text-red-600"
                  )}
                  {renderMetricCard(
                    "Возвраты",
                    monthTotals.returns,
                    <RefreshCcw className="w-6 h-6 text-orange-600" />,
                    "text-orange-600"
                  )}
                </div>

                <Card className="bg-white shadow-lg">
                  <CardHeader className="p-6 border-b">
                    <CardTitle className="text-xl font-bold">Детализация операций</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {/* Месяц */}
                      <div 
                        className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => toggleMonth(monthKey)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            {expandedMonths.includes(monthKey) ? 
                              <ChevronDown className="w-6 h-6 text-gray-400" /> : 
                              <ChevronRight className="w-6 h-6 text-gray-400" />
                            }
                            <span className="text-lg font-medium">
                              {new Date(monthKey).toLocaleString('ru', { month: 'long', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Кассиры */}
                      {expandedMonths.includes(monthKey) && Object.entries(monthData.cashiers).map(([cashierId, cashierData]) => {
                        const cashierTotals = calculateReceiptTotals(
                          Object.values(cashierData.days).flatMap(day => day.receipts)
                        );

                        return (
                          <div key={cashierId} className="pl-8">
                            <div 
                              className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                              onClick={() => toggleCashier(cashierId)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  {expandedCashiers.includes(cashierId) ? 
                                    <ChevronDown className="w-6 h-6 text-gray-400" /> : 
                                    <ChevronRight className="w-6 h-6 text-gray-400" />
                                  }
                                  <span className="text-lg">{cashierId}</span>
                                </div>
                                <div className="flex space-x-6">
                                  <span className="text-green-600">{formatMoney(cashierTotals.sales)}</span>
                                  <span className="text-red-600">{formatMoney(cashierTotals.cancellations)}</span>
                                  <span className="text-orange-600">{formatMoney(cashierTotals.returns)}</span>
                                </div>
                              </div>
                            </div>

                            {/* Дни */}
                            {expandedCashiers.includes(cashierId) && Object.entries(cashierData.days).map(([dayKey, dayData]) => {
                              const dayTotals = calculateReceiptTotals(dayData.receipts);
                              
                              return (
                                <div key={dayKey} className="pl-8">
                                  <div 
                                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                                    onClick={() => toggleDay(dayKey)}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-4">
                                        {expandedDays.includes(dayKey) ? 
                                          <ChevronDown className="w-6 h-6 text-gray-400" /> : 
                                          <ChevronRight className="w-6 h-6 text-gray-400" />
                                        }
                                        <span>{new Date(dayKey).toLocaleDateString('ru')}</span>
                                      </div>
                                      <div className="flex space-x-6">
                                        <span className="text-green-600">{formatMoney(dayTotals.sales)}</span>
                                        <span className="text-red-600">{formatMoney(dayTotals.cancellations)}</span>
                                        <span className="text-orange-600">{formatMoney(dayTotals.returns)}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Чеки */}
                                  {expandedDays.includes(dayKey) && dayData.receipts.map(receipt => {
                                    const receiptTotals = calculateTotals(receipt.products);
                                    
                                    return (
                                      <div key={receipt.id} className="pl-8">
                                        <div 
                                          className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                                          onClick={() => toggleReceipt(receipt.id)}
                                        >
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                              {expandedReceipts.includes(receipt.id) ? 
                                                <ChevronDown className="w-6 h-6 text-gray-400" /> : 
                                                <ChevronRight className="w-6 h-6 text-gray-400" />
                                              }
                                              <div>
                                                <span className="font-medium">Чек №{receipt.id}</span>
                                                <span className="ml-2 text-gray-500">{receipt.time}</span>
                                                <span className="ml-2 px-2 py-1 text-xs rounded-full bg-gray-100">
                                                  {getReceiptType(receipt.type)}
                                                </span>
                                              </div>
                                            </div>
                                            <div className="flex space-x-6">
                                              <span className="text-green-600">{formatMoney(receiptTotals.sales)}</span>
                                              <span className="text-red-600">{formatMoney(receiptTotals.cancellations)}</span>
                                              <span className="text-orange-600">{formatMoney(receiptTotals.returns)}</span>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Товары */}
                                        {expandedReceipts.includes(receipt.id) && (
                                          <div className="pl-8 bg-gray-50 p-4 rounded-lg m-4">
                                            <div className="space-y-2">
                                              {receipt.products.map((product) => (
                                                <div key={product.id} className="flex items-center justify-between p-2 bg-white rounded shadow-sm">
                                                  <div className="flex-1">
                                                    <span className="font-medium">{product.name}</span>
                                                    <span className="ml-2 text-gray-500">x {product.quantity}</span>
                                                  </div>
                                                  <div className="flex space-x-6">
                                                    <span className={`${product.type === 'sale' ? 'text-green-600' : 'text-gray-300'}`}>
                                                      {product.type === 'sale' ? formatMoney(product.total) : '-'}
                                                    </span>
                                                    <span className={`${product.type === 'cancellation' ? 'text-red-600' : 'text-gray-300'}`}>
                                                      {product.type === 'cancellation' ? formatMoney(product.total) : '-'}
                                                    </span>
                                                    <span className={`${product.type === 'return' ? 'text-orange-600' : 'text-gray-300'}`}>
                                                      {product.type === 'return' ? formatMoney(product.total) : '-'}
                                                    </span>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      ) : (
        <div>Загрузка данных...</div>
      )}
    </div>
  );
}