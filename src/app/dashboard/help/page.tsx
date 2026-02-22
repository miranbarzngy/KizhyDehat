'use client'

import { motion } from 'framer-motion'

// Animation variants for staggered entrance
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 12
    }
  }
}

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 80,
      damping: 15
    }
  }
}

export default function HelpPage() {
  return (
    <div className="min-h-screen w-full max-w-[2800px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 drop-shadow-lg">
          ڕێنمایی بەکارهێنانی سیستم
        </h1>
        <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
          بۆ ئەوەی سیستەمەکە بە شێوەیەکی  گونجاو کار بکات و داتاکانتان پارێزراوبێت، 
          پێویستە هەنگاوەکانی خوارەوە بە دروستی جێبەجێ بکەن.
        </p>
      </motion.header>

      {/* Main Content Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        
        {/* Section 1: Initial Setup */}
        <motion.section variants={itemVariants} className="md:col-span-2 lg:col-span-3">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-700/50 shadow-2xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-3 sm:p-4 rounded-2xl shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">ئامادەکارییە سەرەتاییەکان</h2>
            </div>
            
            <p className="text-slate-300 mb-6 text-lg leading-relaxed">
              <span className="text-amber-400 font-bold">گرنگ:</span> پێویستە سەرەتا ئەم بەشانەی خوارەوە زیاد بکەین، 
              پێش ئەوەی بتوانین هیچ کاڵایەک بۆ سیستەم زیاد بکەین.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Unit Card */}
              <motion.div 
                variants={cardVariants}
                className="bg-slate-900/60 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/40 hover:border-indigo-500/50 transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-indigo-500/20 p-2 rounded-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-white">یەکە</h3>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">
                  زیادکردنی یەکەکان (دانە، کیلۆ، لیتر، مەتر...)
                </p>
              </motion.div>

              {/* Category Card */}
              <motion.div 
                variants={cardVariants}
                className="bg-slate-900/60 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/40 hover:border-indigo-500/50 transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-indigo-500/20 p-2 rounded-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-white">پۆل</h3>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">
                  دروستکردنی پۆلەکان بۆ دابەشکردنی کاڵاکان
                </p>
              </motion.div>

              {/* Supplier Card */}
              <motion.div 
                variants={cardVariants}
                className="bg-slate-900/60 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/40 hover:border-indigo-500/50 transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-indigo-500/20 p-2 rounded-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-white">دابینکار</h3>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">
                  زیادکردنی دابینکاران بۆ کڕینی کاڵا
                </p>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Section 2: Sales & Invoices */}
        <motion.section variants={itemVariants} className="lg:col-span-2">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-700/50 shadow-2xl h-full">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 sm:p-4 rounded-2xl shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
                </svg>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">پرۆسەی فرۆشتن و پسوڵەکان</h2>
            </div>

            <div className="space-y-5">
              {/* Customer Selection */}
              <motion.div 
                variants={cardVariants}
                className="bg-slate-900/60 backdrop-blur-sm rounded-xl p-4 border border-slate-700/40"
              >
                <div className="flex items-start gap-3">
                  <div className="bg-emerald-500/20 p-2 rounded-lg mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">هەڵبژاردنی کڕیار</h3>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      بۆ ئەنجامدانی هەر فرۆشتنێک، پێویستە کڕیارێک هەڵبژێرین. ئەمە یارمەتی دەدات لە ڕاستی مێژووی فرۆشتن و قەرز.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Pending Sales */}
              <motion.div 
                variants={cardVariants}
                className="bg-slate-900/60 backdrop-blur-sm rounded-xl p-4 border border-slate-700/40"
              >
                <div className="flex items-start gap-3">
                  <div className="bg-amber-500/20 p-2 rounded-lg mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">لۆجیکی فرۆشتن</h3>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      فرۆشتنەکان بە شێوەیەکی کاتی تۆمار دەکرێن و <span className="text-amber-400 font-bold"> پێویستە لە بەشی پسوڵەکان پەسەند بکرێن </span> 
                        بۆ ئەوەی قازانج و خەرجییەکان و کۆگاکە نوێ ببنەوە.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Status Tracking */}
              <motion.div 
                variants={cardVariants}
                className="bg-slate-900/60 backdrop-blur-sm rounded-xl p-4 border border-slate-700/40"
              >
                <div className="flex items-start gap-3">
                  <div className="bg-blue-500/20 p-2 rounded-lg mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">تێبینیکردنی دۆخ</h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-sm font-medium">
                        فرۆشراو
                      </span>
                      <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm font-medium">
                        هەڵوەشاوە
                      </span>
                      <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-sm font-medium">
                        گەڕاوە
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Section 3: Data Protection */}
        <motion.section variants={itemVariants}>
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-700/50 shadow-2xl h-full">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-gradient-to-br from-red-500 to-red-600 p-3 sm:p-4 rounded-2xl shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">پاراستنی داتاکان</h2>
            </div>

            <div className="space-y-4">
              <motion.div 
                variants={cardVariants}
                className="bg-slate-900/60 backdrop-blur-sm rounded-xl p-4 border border-slate-700/40"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-red-500/20 p-2 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <p className="text-slate-300 text-sm">
                    <span className="text-white font-bold">کاڵا:</span> ناتوانرێت سڕینەوەی کاڵایەک ئەنجام بدرێت کە مێژووی فرۆشتنی هەبێت
                  </p>
                </div>
              </motion.div>

              <motion.div 
                variants={cardVariants}
                className="bg-slate-900/60 backdrop-blur-sm rounded-xl p-4 border border-slate-700/40"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-red-500/20 p-2 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <p className="text-slate-300 text-sm">
                    <span className="text-white font-bold">کڕیار:</span> ناتوانرێت سڕینەوەی کڕیارێک ئەنجام بدرێت کە پسوڵەی فرۆشتنی بەناو بێت
                  </p>
                </div>
              </motion.div>

              <motion.div 
                variants={cardVariants}
                className="bg-slate-900/60 backdrop-blur-sm rounded-xl p-4 border border-slate-700/40"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-red-500/20 p-2 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <p className="text-slate-300 text-sm">
                    <span className="text-white font-bold">دابینکار:</span> ناتوانرێت سڕینەوەی دابینکارێک ئەنجام بدرێت کە کاڵا بەناو زید کرابێت
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Section 4: Admin & Permissions */}
        <motion.section variants={itemVariants} className="md:col-span-2 lg:col-span-3">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-700/50 shadow-2xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-gradient-to-br from-violet-500 to-violet-600 p-3 sm:p-4 rounded-2xl shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">بەڕێوەبردنی ئەژمێرەکان</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Role-based Permissions */}
              <motion.div 
                variants={cardVariants}
                className="bg-slate-900/60 backdrop-blur-sm rounded-xl p-5 border border-slate-700/40"
              >
                <div className="flex items-start gap-3">
                  <div className="bg-violet-500/20 p-2 rounded-lg mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">ڕۆڵ و دەسەڵاتەکان</h3>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      بەپێی ڕۆڵەکەیان، بەکارهێنەران دەتوانن پەیوەندی بە بەشە جیاوازەکانی سیستەمەوە هەبێت .
                      ئەمە یارمەتی دەدات بۆ کۆنترۆڵکردنی دەستپێگەیشتن.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Deactivate Users */}
              <motion.div 
                variants={cardVariants}
                className="bg-slate-900/60 backdrop-blur-sm rounded-xl p-5 border border-slate-700/40"
              >
                <div className="flex items-start gap-3">
                  <div className="bg-violet-500/20 p-2 rounded-lg mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">نا چالاکردنی بەکارهێنەر</h3>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      ئەدمینەکان دەتوانن بەکارهێنەرێکی ناچالاک بکەن بۆ ئەوەی ڕێگە بەو بەکارهێنەرە نەدرێت بچێتە ناو سیستەمەوە.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Footer */}
        <motion.footer 
          variants={itemVariants}
          className="md:col-span-2 lg:col-span-3 mt-4"
        >
          <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/30 text-center">
            <p className="text-slate-400 text-sm">
              بۆ زانیاری زیاتر یان یارمەتی، تکایە پەیوەندی بکە بە تیمی پشتیوانی.
            </p>
            <p className="text-slate-500 text-xs mt-2">
              وەشانی سیستەم: 1.0.0
            </p>
          </div>
        </motion.footer>

      </motion.div>
    </div>
  )
}
