'use client'

import { useAuth } from '@/contexts/AuthContext'

export default function HelpPage() {
  const { profile } = useAuth()

  return (
    <div className="w-full max-w-[2800px] mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">ڕێنمای بەکارهێنان</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 gap-6">
        {/* Adding Stock from Suppliers */}
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg">
          <div className="flex items-center mb-6">
            <div className="bg-blue-500 p-3 rounded-full mr-4">
              📦
            </div>
            <h2 className="text-2xl font-bold text-gray-900">زیادکردنی کۆگا لە دابینکەران</h2>
          </div>

          <div className="space-y-4 text-gray-700 leading-relaxed">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">1. چوونە ناو بەشی کۆگا</h3>
              <p>لە سایدباردا کلیک لە "کۆگا" بکە و پاشان کلیک لە دوگمەی "زیادکردنی کۆگا" بکە.</p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">2. هەڵبژاردنی دابینکەر</h3>
              <p>لە لیستەی دابینکەران، دابینکەرەکە هەڵبژێرە کە کاڵاکانی لێ وەردەگریت. قەرزی ئێستای دابینکەر پیشان دەدرێت.</p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">3. زیادکردنی کاڵاکان</h3>
              <p>بۆ هەر کاڵایەک، زانیارییەکانی پڕبکەرەوە:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>ناوی کاڵا</li>
                <li>نرخی کڕین (لە دابینکەر)</li>
                <li>نرخی فرۆشتن (بۆ کڕیاران)</li>
                <li>کۆگا (بڕی کاڵا)</li>
                <li>یەکە (دانە، کیلۆ، لیتر)</li>
              </ul>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">4. تۆمارکردن</h3>
              <p>کلیک لە "زیادکردنی کاڵا" بکە بۆ زیادکردنی کاڵای زیاتر، پاشان کلیک لە "تۆمارکردن" بکە. سیستەم بە شێوەی خۆکار کۆگا زیاد دەکات و قەرزی دابینکەر نوێ دەکاتەوە.</p>
            </div>
          </div>
        </div>

        {/* Selling by Weight */}
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg">
          <div className="flex items-center mb-6">
            <div className="bg-green-500 p-3 rounded-full mr-4">
              ⚖️
            </div>
            <h2 className="text-2xl font-bold text-gray-900">فرۆشتنی کاڵا بە کێش</h2>
          </div>

          <div className="space-y-4 text-gray-700 leading-relaxed">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">1. چوونە ناو بەشی فرۆشتن</h3>
              <p>لە سایدباردا کلیک لە "فرۆشتن" بکە.</p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">2. هەڵبژاردنی کاڵای کێشی</h3>
              <p>کلیک لە کاڵایەک بکە کە یەکەی "کیلۆ" یان "kg" بێت. پەنجەرەیەک دەکرێتەوە بۆ دیاریکردنی کێش.</p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">3. دیاریکردنی کێش</h3>
              <p>کێش بنووسە (بۆ نموونە: 1.500) یان کلیک لە دوگمەکانی خێرا بکە:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>0.25 کیلۆ</li>
                <li>0.5 کیلۆ</li>
                <li>1 کیلۆ</li>
                <li>2 کیلۆ</li>
              </ul>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">4. زیادکردن بۆ سەبەتە</h3>
              <p>کلیک لە "زیادکردن" بکە. کاڵاکە بە کێشی دیاریکراو زیاد دەکرێت بۆ سەبەتە و نرخ بە شێوەی خۆکار حساب دەکرێت.</p>
            </div>
          </div>
        </div>

        {/* Recording Customer Payments */}
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg">
          <div className="flex items-center mb-6">
            <div className="bg-purple-500 p-3 rounded-full mr-4">
              💰
            </div>
            <h2 className="text-2xl font-bold text-gray-900">تۆمارکردنی پارەدانی کڕیاران</h2>
          </div>

          <div className="space-y-4 text-gray-700 leading-relaxed">
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-900 mb-2">1. چوونە ناو بەشی کڕیاران</h3>
              <p>لە سایدباردا کلیک لە "کڕیاران" بکە.</p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-900 mb-2">2. هەڵبژاردنی کڕیار</h3>
              <p>لە لیستەی کڕیاران، کلیک لە کڕیارەکە بکە کە پارەی داوە. قەرزی ئێستای کڕیار پیشان دەدرێت.</p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-900 mb-2">3. کلیک لە "پارەدان"</h3>
              <p>لە بەشی زانیارییەکانی کڕیار، کلیک لە دوگمەی "پارەدان" بکە.</p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-900 mb-2">4. پڕکردنەوەی زانیارییەکان</h3>
              <p>بڕی پارەی وەرگیراو بنووسە و تێبینییەک بنووسە (ئارەزوومەندانە).</p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-900 mb-2">5. تۆمارکردن</h3>
              <p>کلیک لە "زیادکردن" بکە. سیستەم بە شێوەی خۆکار قەرزی کڕیار کەم دەکاتەوە و تۆمار لە مێژووی پارەدان زیاد دەکات.</p>
            </div>
          </div>
        </div>

        {/* Generating Monthly Payroll */}
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg">
          <div className="flex items-center mb-6">
            <div className="bg-orange-500 p-3 rounded-full mr-4">
              👥
            </div>
            <h2 className="text-2xl font-bold text-gray-900">دروستکردنی مووچەی مانگانە</h2>
          </div>

          <div className="space-y-4 text-gray-700 leading-relaxed">
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="font-semibold text-orange-900 mb-2">1. چوونە ناو بەشی مووچە</h3>
              <p>لە سایدباردا کلیک لە "مووچە" بکە.</p>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="font-semibold text-orange-900 mb-2">2. زیادکردنی کارمەند (ئەگەر پێویست بوو)</h3>
              <p>کلیک لە "زیادکردنی کارمەند" بکە و زانیارییەکانی پڕبکەرەوە (ناو و مووچەی مانگانە).</p>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="font-semibold text-orange-900 mb-2">3. دروستکردنی مووچەی مانگانە</h3>
              <p>کلیک لە "دروستکردنی مووچەی مانگانە" بکە. مانگ و ساڵ هەڵبژێرە.</p>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="font-semibold text-orange-900 mb-2">4. پارەدانی مووچە</h3>
              <p>بۆ هەر کارمەندێک کە مووچەی وەرگرتووە، کلیک لە "پارەدان" بکە. سیستەم بە شێوەی خۆکار مووچە زیاد دەکات بۆ خەرجییەکان.</p>
            </div>
          </div>
        </div>

        {/* Online Menu */}
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg">
          <div className="flex items-center mb-6">
            <div className="bg-teal-500 p-3 rounded-full mr-4">
              📱
            </div>
            <h2 className="text-2xl font-bold text-gray-900">مێنوی ئۆنلاین</h2>
          </div>

          <div className="space-y-4 text-gray-700 leading-relaxed">
            <div className="bg-teal-50 p-4 rounded-lg">
              <h3 className="font-semibold text-teal-900 mb-2">چۆن کار دەکات</h3>
              <p>مێنوی ئۆنلاین ڕێگەیەکە بۆ کڕیاران بۆ بینینی کاڵاکان و داواکردنیان لە ڕێگەی واتسئاپ. هیچ پێویستی بە چوونەژوورەوە نیە.</p>
            </div>

            <div className="bg-teal-50 p-4 rounded-lg">
              <h3 className="font-semibold text-teal-900 mb-2">چۆن کاڵا نمایش بدرێت</h3>
              <p>لە بەشی کۆگا، بۆ هەر کاڵایەک کە دەتەوێت لە مێنوی ئۆنلاین نمایش بدرێت، چێکی "ئۆنلاین" بکە. تەنها کاڵاکانی کۆگا هەیە نمایش دەدرێن.</p>
            </div>

            <div className="bg-teal-50 p-4 rounded-lg">
              <h3 className="font-semibold text-teal-900 mb-2">بڵاوکردنەوەی لینک</h3>
              <p>لینکی مێنوی ئۆنلاین: <code className="bg-gray-200 px-2 py-1 rounded">yourdomain.com/menu</code></p>
              <p className="mt-2">دەتوانیت:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>QR کۆد دروست بکە بۆ لینکەکە</li>
                <li>لینکەکە لە سۆشیال میدیا بڵاو بکەرەوە</li>
                <li>لە وێبسایتەکەت لینک بکە</li>
              </ul>
            </div>

            <div className="bg-teal-50 p-4 rounded-lg">
              <h3 className="font-semibold text-teal-900 mb-2">چۆن کڕیاران داوا دەکەن</h3>
              <p>کڕیاران کاڵا زیاد دەکەن بۆ سەبەتە، کێش دیاری دەکەن بۆ کاڵاکانی کێشی، پاشان کلیک لە "ناردنی داواکاری بۆ واتسئاپ" دەکەن. نامەیەکی فۆرماتکراو بە زمانی کوردی دەنێردرێت بۆ ژمارەی واتسئاپی فرۆشگا.</p>
            </div>
          </div>
        </div>

        {/* Support */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3 2xl:col-span-4 3xl:col-span-5 bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg text-center">
          <div className="bg-gray-100 p-6 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-2">پێویست بە یارمەتی زیاترە؟</h3>
            <p className="text-gray-600">
              بۆ پرسیارەکان، تکایە پەیوەندی بکە بە تیمەکەمان یان سەردانی بەشی بەڕێوەبەران بکە.
            </p>
            <div className="mt-4 text-sm text-gray-500">
              وەشانی سیستەم: 1.0.0 | بەروار: {new Date().toLocaleDateString('ku')}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
