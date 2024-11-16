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

  // Тестовые данные
  const testData: SalesData = {
    months: {
      "2023-10": {
        cashiers: {
          "ivanov": {
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
                        name: "Молоко",
                        quantity: 1,
                        price: 80,
                        total: 80,
                        type: "sale"
                      }
                    ]
                  },
                  {
                    id: "2",
                    time: "11:30",
                    amount: 1500,
                    type: "cancellation",
                    products: [
                      {
                        id: "prod3",
                        name: "Сыр",
                        quantity: 1,
                        price: 300,
                        total: 300,
                        type: "cancellation"
                      }
                    ]
                  }
                ]
              }
            }
          },
          "petrov": {
            sales: 120000,
            cancellations: 1800,
            returns: 1200,
            days: {
              "2023-10-01": {
                sales: 40000,
                cancellations: 800,
                returns: 400,
                receipts: []
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

  const getOperationType = (type: 'sale' | 'cancellation' | 'return') => {
    switch (type) {
      case 'sale': return 'Продажа';
      case 'cancellation': return 'Сторно';
      case 'return': return 'Возврат';
    }
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
          {Object.entries(testData.months).map(([monthKey, monthData]) => (
            <div key={monthKey}>
              {/* Месяц */}
              <div 
                className="grid grid-cols-4 gap-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => toggleMonth(monthKey)}
              >
                <div className="font-medium flex items-center">
                  {expandedMonths.includes(monthKey) ? <ChevronDown className="w-4 h-4 mr-2" /> : <ChevronRight className="w-4 h-4 mr-2" />}
                  {new Date(monthKey).toLocaleString('ru', { month: 'long', year: 'numeric' })}
                </div>
                <div className="text-green-600">{formatMoney(150000)}</div>
                <div className="text-red-600">{formatMoney(2000)}</div>
                <div className="text-orange-600">{formatMoney(1500)}</div>
              </div>

              {/* Кассиры */}
              {expandedMonths.includes(monthKey) && Object.entries(monthData.cashiers).map(([cashierId, cashierData]) => (
                <div key={cashierId} className="ml-6">
                  <div 
                    className="grid grid-cols-4 gap-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => toggleCashier(cashierId)}
                  >
                    <div className="font-medium flex items-center">
                      {expandedCashiers.includes(cashierId) ? <ChevronDown className="w-4 h-4 mr-2" /> : <ChevronRight className="w-4 h-4 mr-2" />}
                      {cashierId}
                    </div>
                    <div className="text-green-600">{formatMoney(cashierData.sales)}</div>
                    <div className="text-red-600">{formatMoney(cashierData.cancellations)}</div>
                    <div className="text-orange-600">{formatMoney(cashierData.returns)}</div>
                  </div>

                  {/* Дни */}
                  {expandedCashiers.includes(cashierId) && Object.entries(cashierData.days).map(([dayKey, dayData]) => (
                    <div key={dayKey} className="ml-6">
                      <div 
                        className="grid grid-cols-4 gap-4 hover:bg-gray-50 cursor-pointer"
                        onClick={() => toggleDay(dayKey)}
                      >
                        <div className="font-medium flex items-center">
                          {expandedDays.includes(dayKey) ? <ChevronDown className="w-4 h-4 mr-2" /> : <ChevronRight className="w-4 h-4 mr-2" />}
                          {new Date(dayKey).toLocaleDateString('ru')}
                        </div>
                        <div className="text-green-600">{formatMoney(dayData.sales)}</div>
                        <div className="text-red-600">{formatMoney(dayData.cancellations)}</div>
                        <div className="text-orange-600">{formatMoney(dayData.returns)}</div>
                      </div>

                      {/* Чеки */}
                      {expandedDays.includes(dayKey) && dayData.receipts.map((receipt) => (
                        <div key={receipt.id}>
                          <div 
                            className="ml-6 grid grid-cols-4 gap-4 hover:bg-gray-50 cursor-pointer"
                            onClick={() => toggleReceipt(receipt.id)}
                          >
                            <div className="font-medium flex items-center">
                              {expandedReceipts.includes(receipt.id) ? 
                                <ChevronDown className="w-4 h-4 mr-2" /> : 
                                <ChevronRight className="w-4 h-4 mr-2" />
                              }
                              {receipt.time} - Чек №{receipt.id} ({getOperationType(receipt.type)})
                            </div>
                            <div className={`
                              ${receipt.type === 'sale' ? 'text-green-600' : 
                                receipt.type === 'cancellation' ? 'text-red-600' : 
                                'text-orange-600'}
                            `}>
                              {formatMoney(receipt.amount)}
                            </div>
                            <div></div>
                            <div></div>
                          </div>

                          {/* Товары */}
                          {expandedReceipts.includes(receipt.id) && receipt.products.map((product) => (
                            <div key={product.id} className="ml-12 grid grid-cols-4 gap-4 hover:bg-gray-50">
                              <div className="font-medium">
                                {product.name} x {product.quantity}
                              </div>
                              <div className={`
                                ${product.type === 'sale' ? 'text-green-600' : 
                                  product.type === 'cancellation' ? 'text-red-600' : 
                                  'text-orange-600'}
                              `}>
                                {formatMoney(product.total)}
                              </div>
                              <div className="text-gray-500">
                                {formatMoney(product.price)} за ед.
                              </div>
                              <div className="text-gray-500">
                                {getOperationType(product.type)}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}