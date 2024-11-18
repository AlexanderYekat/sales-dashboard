import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, RefreshCcw, XCircle, AlertCircle } from 'lucide-react';
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

  type: OperationType;

  storno: boolean;

}



interface Receipt {

  id: string;

  time: string;

  amount: number;

  type: OperationType;

  products: Product[];

  state: string;

}


interface DayData {

  sales: number;

  storno: number;

  returns: number;

  deposits: number;     // внесения

  withdrawals: number;  // выплаты

  cancelOperations: number; // Добавляем поле для отменённых операций

  receipts: Receipt[];

}


interface CashierData {

  sales: number;

  storno: number;

  returns: number;

  cancelOperations: number;

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
  CHEQUETYPE: string;
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

type OperationType = 'sale' | 'return' | 'deposit' | 'withdrawal';

// Функция для преобразования данных CSV в формат SalesData
const convertCsvToSalesData = (csvData: CsvRow[]): SalesData => {
  const salesData: SalesData = { months: {} };

  const parseRussianDate = (dateStr: string) => {
    //console.log('⏰ Обработка даты:', dateStr);
    
    try {
      if (!dateStr || typeof dateStr !== 'string') {
        console.error('❌ Ошибка парсинга даты:');
        console.log('Некорректная входная строка:', dateStr);
        return new Date();
      }

      const parts = dateStr.split('.');
      if (parts.length !== 3) {
        console.error('❌ Ошибка парсинга даты:');
        console.log('Неверный формат даты (должен быть DD.MM.YYYY):', dateStr);
        return new Date();
      }

      const [day, month, year] = parts.map(Number);
      
      // Проверка валидности компонентов даты
      if (isNaN(day) || isNaN(month) || isNaN(year) ||
          day < 1 || day > 31 || month < 1 || month > 12) {
        console.error('❌ Ошибка парсинга даты:');
        console.log('Исходная строка даты:', dateStr);
        console.log('Разбор даты:', { day, month, year });
        return new Date();
      }

      const fullYear = year >= 100 ? year : 2000 + year;
      const date = new Date(fullYear, month - 1, day);
      
      if (isNaN(date.getTime())) {
        console.error('❌ Ошибка парсинга даты:');
        console.log('Исходная строка даты:', dateStr);
        console.log('Разбор даты:', { day, month, year });
        console.log('Полный год:', fullYear);
        console.log('Созданная дата:', date);
        return new Date();
      }
      
      return date;
    } catch (error) {
      console.error('❌ Ошибка при парсинге даты:', dateStr, error);
      return new Date();
    }
  };

  const parseRussianNumber = (numStr: string) => {
    return parseFloat(numStr.replace(/\s/g, '').replace(',', '.'));
  };

  csvData.forEach(row => {
    if (!row.TRANZDATE || !row.CASHIER) {
      return;
    }

    if (row.TRANZTYPE === '55' || row.TRANZTYPE === '56') {
      return;
    }

    const date = parseRussianDate(row.TRANZDATE);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const dayKey = formatDateSafe(row.TRANZDATE);
    const cashier = row.CASHIER.trim();
    const amount = parseRussianNumber(row.SUMM);
    const storno = row.TRANZTYPE === '12';

    // Инициализируем структуру данных если нужно
    if (!salesData.months[monthKey]) {
      salesData.months[monthKey] = { cashiers: {} };
    }
    if (!salesData.months[monthKey].cashiers[cashier]) {
      salesData.months[monthKey].cashiers[cashier] = {
        sales: 0,
        storno: 0,
        returns: 0,
        cancelOperations: 0,
        days: {}
      };
    }
    if (!salesData.months[monthKey].cashiers[cashier].days[dayKey]) {
      salesData.months[monthKey].cashiers[cashier].days[dayKey] = {
        sales: 0,
        storno: 0,
        returns: 0,
        deposits: 0,
        withdrawals: 0,
        cancelOperations: 0,
        receipts: []
      };
    }

    // Определяем тип операции
    let operationType: OperationType;
    //if (row.TRANZTYPE === '12') {
    //  operationType = 'cancellation';  
    //} else if (row.CHEQUETYPE === '1') {
    if (row.CHEQUETYPE === '1') {
      operationType = 'return';
    } else if (row.CHEQUETYPE === '4') {
      operationType = 'deposit';
    } else if (row.CHEQUETYPE === '5') {
      operationType = 'withdrawal';
    } else {
      operationType = 'sale';
    }

    // Создаем чек независимо от его состояния
    const receipt: Receipt = {
      id: row.CHEQUENUMBER,
      time: row.TRANZTIME,
      amount: amount,
      type: operationType,
      state: row.STATE,
      products: [{
        id: row.CODE,
        name: row.NAME,
        quantity: parseRussianNumber(row.QUANTITY),
        price: parseRussianNumber(row.PRICE),
        total: amount,
        type: operationType,
        storno: storno
      }]
    };

    // Добавляем чек в массив, независимо от его состояния
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

const formatDateSafe = (dateStr: string) => {
  try {
    // Проверяем входные данные
    if (!dateStr || typeof dateStr !== 'string') return dateStr;

    // Разбираем дату
    const [day, month, year] = dateStr.split('.');
    if (!day || !month || !year) return dateStr;

    // Создаем дату в правильном формате
    const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    
    if (isNaN(date.getTime())) {
      console.error('❌ Invalid Date в рендере:', {
        dateStr,
        day,
        month,
        year,
        date
      });
      return dateStr;
    }
    
    return date.toLocaleDateString('ru');
  } catch (error) {
    console.error('❌ Ошибка при форматировании даты:', dateStr, error);
    return dateStr;
  }
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
        const response = await fetch('./reports2.csv');
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



  const getReceiptType = (type: 'sale' | 'return' | 'deposit' | 'withdrawal') => {

    switch (type) {

      case 'sale': return 'Продажа';

      //case 'cancellation': return 'Сторно';

      case 'return': return 'Возврат';

      case 'deposit': return 'Внесение';

      case 'withdrawal': return 'Выплата';

      default: return 'Продажа';

    }

  };



  // Функция для подсчёта сумм по продуктам

  const calculateTotals = (products: Product[], state: string) => {
    const totals = products.reduce((totals, product) => {
      // Для отменённых чеков (state !== '1') считаем в cancelOperations
      if (state !== '1') {
        totals.cancelOperations += product.total;
        return totals;
      }

      if (product.storno) {
        totals.storno += product.total;
      }

      // Продажае
      if (product.type === 'sale') {
        totals.sales += product.total;
      //} else if (product.type === 'cancellation') {
      //  totals.sales += product.total;
      //  totals.storno += product.total;
      } else if (product.type === 'return') {
        totals.returns += product.total;
      }
      return totals;
    }, { sales: 0, storno: 0, returns: 0, cancelOperations: 0 });

    //totals.sales = Math.max(0, totals.sales);
    return totals;
  };



  // Функция для подсчёта сумм по чекам

  const calculateReceiptTotals = (receipts: Receipt[]) => {
    return receipts.reduce((totals, receipt) => {
      // Если чек недействительный (state !== '1'), добавляем всю сумму в cancelOperations
      if (receipt.state !== '1') {
        //totals.cancelOperations += Math.abs(receipt.amount); // Добавляем Math.abs для корректного подсчета
        totals.cancelOperations += receipt.amount; // Добавляем Math.abs для корректного подсчета
        return totals;
      }

      // Для действительных чеков считаем как раньше
      const receiptTotals = calculateTotals(receipt.products, receipt.state);
      totals.sales += receiptTotals.sales;
      totals.storno += receiptTotals.storno;
      totals.returns += receiptTotals.returns;
      return totals;
    }, { sales: 0, storno: 0, returns: 0, cancelOperations: 0 });
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
            <p className="mt-2 text-gray-600">Детальная статистика по операциям</p>
          </div>

          {Object.entries(salesData.months).map(([monthKey, monthData]) => {
            const allReceipts = Object.values(monthData.cashiers).flatMap(cashier => 
              Object.values(cashier.days).flatMap(day => day.receipts)
            );
            const monthTotals = calculateReceiptTotals(allReceipts);

            // Подсчитываем сумму отмен за месяц
            const cancelOperationsTotal = Object.values(monthData.cashiers).reduce((total, cashier) => {
              return total + Object.values(cashier.days).reduce((dayTotal, day) => {
                const dayCancelTotal = day.receipts.reduce((receiptTotal, receipt) => {
                  if (receipt.state !== '1') {
                    //return receiptTotal + Math.abs(receipt.amount);
                    return receiptTotal + receipt.amount;
                  }
                  return receiptTotal;
                }, 0);
                return dayTotal + dayCancelTotal;
              }, 0);
            }, 0);

            return (
              <div key={monthKey} className="space-y-6 mb-16">
                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold text-gray-800">
                    {new Date(monthKey).toLocaleString('ru', { 
                      month: 'long', 
                      year: 'numeric'
                    })}
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {renderMetricCard(
                      "Продажи",
                      monthTotals.sales,
                      <span className="w-6 h-6 text-green-600 font-bold">₽</span>,
                      "text-green-600"
                    )}
                    {renderMetricCard(
                      "Сторно",
                      monthTotals.storno,
                      <XCircle className="w-6 h-6 text-red-600" />,
                      "text-red-600"
                    )}
                    {renderMetricCard(
                      "Возвраты",
                      monthTotals.returns,
                      <RefreshCcw className="w-6 h-6 text-orange-600" />,
                      "text-orange-600"
                    )}
                    {renderMetricCard(
                      "Отмена",
                      cancelOperationsTotal,
                      <AlertCircle className="w-6 h-6 text-gray-600" />,
                      "text-gray-600"
                    )}
                  </div>
                </div>

                <div className="mt-8">
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
                                    <span className="text-red-600">{formatMoney(cashierTotals.storno)}</span>
                                    <span className="text-orange-600">{formatMoney(cashierTotals.returns)}</span>
                                    <span className="text-gray-600">{formatMoney(cashierTotals.cancelOperations)}</span>
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
                                          <span>{formatDateSafe(dayKey)}</span>
                                        </div>
                                        <div className="flex space-x-6">
                                          <span className="text-green-600">{formatMoney(dayTotals.sales)}</span>
                                          <span className="text-red-600">{formatMoney(dayTotals.storno)}</span>
                                          <span className="text-orange-600">{formatMoney(dayTotals.returns)}</span>
                                          <span className="text-gray-600">{formatMoney(dayTotals.cancelOperations)}</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Чеки */}
                                    {expandedDays.includes(dayKey) && (
                                      <div key={dayKey} className="pl-8">
                                        {/* Существующая информация о дне */}
                                        
                                        {/* Добавляем информацию о внесениях и выплатах */}
                                        {(dayData.deposits > 0 || dayData.withdrawals > 0) && (
                                          <div className="ml-4 mt-2 text-sm text-gray-500">
                                            {dayData.deposits > 0 && (
                                              <span className="mr-4">Весения: {formatMoney(dayData.deposits)}</span>
                                            )}
                                            {dayData.withdrawals > 0 && (
                                              <span>Выплаты: {formatMoney(dayData.withdrawals)}</span>
                                            )}
                                          </div>
                                        )}

                                        {/* Существующий код для чеков */}
                                        {dayData.receipts.map(receipt => {
                                          const receiptTotals = calculateTotals(receipt.products, receipt.state);
                                          const isCanceled = receipt.state !== '1';
                                          
                                          return (
                                            <div key={receipt.id} className="pl-8">
                                              <div 
                                                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                                                  isCanceled ? 'bg-red-50' : ''
                                                }`}
                                                onClick={() => toggleReceipt(receipt.id)}
                                              >
                                                <div className="flex items-center justify-between">
                                                  <div className="flex items-center space-x-4">
                                                    {expandedReceipts.includes(receipt.id) ? 
                                                      <ChevronDown className="w-6 h-6 text-gray-400" /> : 
                                                      <ChevronRight className="w-6 h-6 text-gray-400" />
                                                    }
                                                    <div>
                                                      <span className={`font-medium ${isCanceled ? 'text-red-700' : ''}`}>
                                                        Чек №{receipt.id}
                                                      </span>
                                                      <span className="ml-2 text-gray-500">{receipt.time}</span>
                                                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                                                        isCanceled 
                                                          ? 'bg-red-100 text-red-700' 
                                                          : 'bg-gray-100'
                                                      }`}>
                                                        {getReceiptType(receipt.type)} {receipt.state === '1' ? '' : 'Отменённый'}
                                                      </span>
                                                      {(receipt.type === 'deposit' || receipt.type === 'withdrawal') && (
                                                        <span className="ml-2 font-medium text-blue-600">
                                                          {formatMoney(receipt.amount)}
                                                        </span>
                                                      )}
                                                    </div>
                                                  </div>
                                                  {!['deposit', 'withdrawal'].includes(receipt.type) && (
                                                    <div className="flex space-x-6">
                                                      <span className="text-green-600">{formatMoney(receiptTotals.sales)}</span>
                                                      <span className="text-red-600">{formatMoney(receiptTotals.storno)}</span>
                                                      <span className="text-orange-600">{formatMoney(receiptTotals.returns)}</span>
                                                      {receipt.state !== '1' && (
                                                        <span className="text-gray-600">{formatMoney(receiptTotals.cancelOperations)}</span>
                                                      )}
                                                    </div>
                                                  )}
                                                </div>
                                              </div>

                                              {/* Товары в чеке тоже подсветим, если чек отменён */}
                                              {expandedReceipts.includes(receipt.id) && (
                                                <div className={`pl-8 ${
                                                  isCanceled ? 'bg-red-50' : 'bg-gray-50'
                                                } p-4 rounded-lg m-4`}>
                                                  <div className="space-y-2">
                                                    {receipt.products.map((product) => (
                                                      <div key={product.id} className={`flex items-center justify-between p-2 ${
                                                        isCanceled ? 'bg-red-50/50' : 'bg-white'
                                                      } rounded shadow-sm`}>
                                                        <div className="flex-1">
                                                          <span className="font-medium">{product.name}</span>
                                                          <span className="ml-2 text-gray-500">x {product.quantity}</span>
                                                        </div>
                                                        <div className="flex space-x-6">
                                                          <span className={`${product.type === 'sale' ? 'text-green-600' : 'text-gray-300'}`}>
                                                            {product.type === 'sale' ? formatMoney(product.total) : '-'}
                                                          </span>
                                                          <span className={`${product.storno ? 'text-red-600' : 'text-gray-300'}`}>
                                                            {product.storno ? formatMoney(product.total) : '-'}
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
                                    )}
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