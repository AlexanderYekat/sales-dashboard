import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

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

export default function SalesReportDashboard() {
  const [expandedMonths, setExpandedMonths] = useState<string[]>([]);
  const [expandedCashiers, setExpandedCashiers] = useState<string[]>([]);
  const [expandedDays, setExpandedDays] = useState<string[]>([]);
  const [expandedReceipts, setExpandedReceipts] = useState<string[]>([]);

  // Тстовые данные
  const testData: SalesData = {
    months: {
      "2023-10": {
        cashiers: {
          "Иванов": {
            sales: 150000,
            cancellations: 2000,
            returns: 1500,
            days: {
              "2023-10-01": {
                sales: 50000,
                cancellations: 1000,
                returns: 500,
                receipts: [
                  {
                    id: "1",
                    time: "10:15",
                    amount: 2500,
                    type: "sale",
                    products: [
                      {
                        id: "prod1",
                        name: "Хлеб белый",
                        quantity: 2,
                        price: 50,
                        total: 100,
                        type: "sale"
                      },
                      {
                        id: "prod2",
                        name: "Молоко 3.2%",
                        quantity: 1,
                        price: 80,
                        total: 80,
                        type: "sale"
                      },
                      {
                        id: "prod3",
                        name: "Сыр Российский",
                        quantity: 1,
                        price: 300,
                        total: 300,
                        type: "cancellation"
                      }
                    ]
                  },
                  {
                    id: "2",
                    time: "11:30",
                    amount: 1500,
                    type: "sale",
                    products: [
                      {
                        id: "prod4",
                        name: "Колбаса Докторская",
                        quantity: 2,
                        price: 600,
                        total: 1200,
                        type: "sale"
                      },
                      {
                        id: "prod5",
                        name: "Сок яблочный",
                        quantity: 1,
                        price: 150,
                        total: 150,
                        type: "cancellation"
                      }
                    ]
                  },
                  {
                    id: "3",
                    time: "12:45",
                    amount: 800,
                    type: "return",
                    products: [
                      {
                        id: "prod6",
                        name: "Йогурт Клубничный",
                        quantity: 4,
                        price: 100,
                        total: 400,
                        type: "return"
                      },
                      {
                        id: "prod7",
                        name: "Печенье Юбилейное",
                        quantity: 2,
                        price: 200,
                        total: 400,
                        type: "return"
                      }
                    ]
                  }
                ]
              }
            }
          },
          "Петров": {
            sales: 120000,
            cancellations: 1800,
            returns: 1200,
            days: {
              "2023-10-01": {
                sales: 40000,
                cancellations: 800,
                returns: 400,
                receipts: [
                  {
                    id: "4",
                    time: "09:30",
                    amount: 3500,
                    type: "sale",
                    products: [
                      {
                        id: "prod8",
                        name: "Масло сливочное",
                        quantity: 2,
                        price: 200,
                        total: 400,
                        type: "sale"
                      },
                      {
                        id: "prod9",
                        name: "Рыба копченая",
                        quantity: 1,
                        price: 2000,
                        total: 2000,
                        type: "cancellation"
                      }
                    ]
                  }
                ]
              }
            }
          }
        }
      }
    }
  };

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

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB'
    }).format(amount);
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

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Отчет по продажам</h1>
      
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="grid grid-cols-4 gap-4 font-semibold mb-4 border-b pb-2">
          <div>Период / Кассир</div>
          <div>Продажи</div>
          <div>Сторно</div>
          <div>Возвраты</div>
        </div>

        <div className="space-y-2">
          {Object.entries(testData.months).map(([monthKey, monthData]) => {
            const allReceipts = Object.values(monthData.cashiers).flatMap(cashier => 
              Object.values(cashier.days).flatMap(day => day.receipts)
            );
            const monthTotals = calculateReceiptTotals(allReceipts);

            return (
              <div key={monthKey}>
                {/* Месяц */}
                <div 
                  className="grid grid-cols-4 gap-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => toggleMonth(monthKey)}
                >
                  <div className="font-medium flex items-center">
                    {expandedMonths.includes(monthKey) ? 
                      <ChevronDown className="w-4 h-4 mr-2" /> : 
                      <ChevronRight className="w-4 h-4 mr-2" />
                    }
                    {new Date(monthKey).toLocaleString('ru', { month: 'long', year: 'numeric' })}
                  </div>
                  <div className="text-green-600">{formatMoney(monthTotals.sales)}</div>
                  <div className="text-red-600">{formatMoney(monthTotals.cancellations)}</div>
                  <div className="text-orange-600">{formatMoney(monthTotals.returns)}</div>
                </div>

                {/* Кассиры */}
                {expandedMonths.includes(monthKey) && Object.entries(monthData.cashiers).map(([cashierId, cashierData]) => {
                  const cashierTotals = calculateReceiptTotals(
                    Object.values(cashierData.days).flatMap(day => day.receipts)
                  );

                  return (
                    <div key={cashierId} className="ml-6">
                      <div 
                        className="grid grid-cols-4 gap-4 hover:bg-gray-50 cursor-pointer"
                        onClick={() => toggleCashier(cashierId)}
                      >
                        <div className="flex items-center">
                          {expandedCashiers.includes(cashierId) ? 
                            <ChevronDown className="w-4 h-4 mr-2" /> : 
                            <ChevronRight className="w-4 h-4 mr-2" />
                          }
                          {cashierId}
                        </div>
                        <div className="text-green-600">{formatMoney(cashierTotals.sales)}</div>
                        <div className="text-red-600">{formatMoney(cashierTotals.cancellations)}</div>
                        <div className="text-orange-600">{formatMoney(cashierTotals.returns)}</div>
                      </div>

                      {/* Дни */}
                      {expandedCashiers.includes(cashierId) && Object.entries(cashierData.days).map(([dayKey, dayData]) => {
                        const dayTotals = calculateReceiptTotals(dayData.receipts);
                        
                        return (
                          <div key={dayKey} className="ml-6">
                            <div 
                              className="grid grid-cols-4 gap-4 hover:bg-gray-50 cursor-pointer"
                              onClick={() => toggleDay(dayKey)}
                            >
                              <div className="flex items-center">
                                {expandedDays.includes(dayKey) ? 
                                  <ChevronDown className="w-4 h-4 mr-2" /> : 
                                  <ChevronRight className="w-4 h-4 mr-2" />
                                }
                                {new Date(dayKey).toLocaleDateString('ru')}
                              </div>
                              <div className="text-green-600">{formatMoney(dayTotals.sales)}</div>
                              <div className="text-red-600">{formatMoney(dayTotals.cancellations)}</div>
                              <div className="text-orange-600">{formatMoney(dayTotals.returns)}</div>
                            </div>
                            
                            {/* Чеки */}
                            {expandedDays.includes(dayKey) && dayData.receipts.map(receipt => {
                              const receiptTotals = calculateTotals(receipt.products);
                              
                              return (
                                <div key={receipt.id}>
                                  <div 
                                    className="ml-6 grid grid-cols-4 gap-4 hover:bg-gray-50 cursor-pointer"
                                    onClick={() => toggleReceipt(receipt.id)}
                                  >
                                    <div className="flex items-center">
                                      {expandedReceipts.includes(receipt.id) ? 
                                        <ChevronDown className="w-4 h-4 mr-2" /> : 
                                        <ChevronRight className="w-4 h-4 mr-2" />
                                      }
                                      {receipt.time} - Чек №{receipt.id} ({getReceiptType(receipt.type)})
                                    </div>
                                    <div className="text-green-600">
                                      {formatMoney(receiptTotals.sales)}
                                    </div>
                                    <div className="text-red-600">
                                      {formatMoney(receiptTotals.cancellations)}
                                    </div>
                                    <div className="text-orange-600">
                                      {formatMoney(receiptTotals.returns)}
                                    </div>
                                  </div>

                                  {/* Товары */}
                                  {expandedReceipts.includes(receipt.id) && receipt.products.map((product) => (
                                    <div key={product.id} className="ml-12 grid grid-cols-4 gap-4 hover:bg-gray-50">
                                      <div className="font-medium">
                                        {product.name} x {product.quantity}
                                      </div>
                                      <div className="text-green-600">
                                        {product.type === 'sale' ? formatMoney(product.total) : ''}
                                      </div>
                                      <div className="text-red-600">
                                        {product.type === 'cancellation' ? formatMoney(product.total) : ''}
                                      </div>
                                      <div className="text-orange-600">
                                        {product.type === 'return' ? formatMoney(product.total) : ''}
                                      </div>
                                    </div>
                                  ))}
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
            );
          })}
        </div>
      </div>
    </div>
  );
}