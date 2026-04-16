import { useState } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion'
import { 
  HelpCircle, 
  CreditCard, 
  FileText,
} from 'lucide-react'

const faqData = {
  general: [
    {
      id: 'general-1',
      icon: HelpCircle,
      question: 'What is lizt?',
      answer: 'Lizt is a free digital rent collection service by Property Kraft. It allows your tenants to pay rent through a secure online gateway, while you get instant notifications and receipts.'
    },
    {
      id: 'general-2',
      icon: CreditCard,
      question: 'How much does it cost?',
      answer: 'Nothing. Rent collection through lizt is completely free for both landlords and tenants.'
    },
    {
      id: 'general-3',
      icon: FileText,
      question: 'How does the rent collection service work?',
      answer: '• You register your property and add tenant details.\n• Tenants pay their rent through lizt (via Paystack/Flutterwave).\n• Payments go directly to your bank account.\n• Both you and your tenant receive instant confirmation and a receipt.'
    },
    {
      id: 'general-4',
      icon: HelpCircle,
      question: 'Can I track payments?',
      answer: 'Yes. Lizt keeps a full record of all payments, due dates, late payments, and any outstanding balances.'
    },
    {
      id: 'general-5',
      icon: FileText,
      question: 'How do I sign up?',
      answer: 'It takes less than 5 minutes. Sign up here via WhatsApp.'
    }
  ],
  pricing: [
    {
      id: 'pricing-1',
      icon: CreditCard,
      question: 'How do I pay rent with lizt?',
      answer: 'Simply log in to lizt, enter your details, and pay using your preferred method (bank card, transfer, or USSD).'
    },
    {
      id: 'pricing-2',
      icon: HelpCircle,
      question: 'Where does my rent money go?',
      answer: 'Directly into your landlord\'s bank account. Lizt does not hold your money — we only process and track the payment.'
    },
    {
      id: 'pricing-3',
      icon: CreditCard,
      question: 'Will I be charged extra fees?',
      answer: 'No. Rent payments through lizt are free for tenants.'
    },
    {
      id: 'pricing-4',
      icon: FileText,
      question: 'How will I know if my payment is received?',
      answer: 'You\'ll get an instant digital receipt from lizt once your payment is successful, and your landlord will be notified too.'
    },
    {
      id: 'pricing-5',
      icon: HelpCircle,
      question: 'Can lizt remind me when my rent is due?',
      answer: 'Yes. Lizt sends you friendly reminders ahead of your rent due date so you never miss a deadline.'
    }
  ],
  documentation: [
    {
      id: 'doc-1',
      icon: HelpCircle,
      question: 'Is it safe to pay rent through lizt?',
      answer: 'Yes. Lizt uses trusted, regulated payment gateways like Paystack and Flutterwave. Your transactions are encrypted and secure.'
    },
    {
      id: 'doc-2',
      icon: CreditCard,
      question: 'Does lizt keep my rent money?',
      answer: 'No. Rent is paid directly into your landlord\'s bank account. Lizt only provides the payment gateway and receipts.'
    },
    {
      id: 'doc-3',
      icon: FileText,
      question: 'Can I stop using lizt if I change my mind?',
      answer: 'Yes. There are no commitments or hidden fees. Both landlords and tenants can stop at any time.'
    }
  ]
}

export function FAQ() {
  const [activeTab, setActiveTab] = useState<'general' | 'pricing' | 'documentation'>('general')

  const tabs = [
    { id: 'general' as const, label: 'For Landlords' },
    { id: 'pricing' as const, label: 'For Tenants' },
    { id: 'documentation' as const, label: 'Security & Transparency' }
  ]

  const currentFAQs = faqData[activeTab]

  return (
    <section className="bg-white py-16 lg:py-20">
      <div className="max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-gray-100 text-gray-900 border border-gray-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-4xl">
          <Accordion type="single" collapsible className="space-y-4">
            {currentFAQs.map((faq) => {
              const IconComponent = faq.icon
              return (
                <AccordionItem 
                  key={faq.id} 
                  value={faq.id}
                  className="bg-white border border-gray-200 rounded-lg px-6 py-2"
                >
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-4 text-left">
                      <div className="flex-shrink-0 w-5 h-5 text-gray-400">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <span className="font-semibold text-gray-900">
                        {faq.question}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-6 pt-2">
                    <div className="ml-9 text-gray-600 leading-relaxed">
                      {faq.answer.split('\n').map((line, index) => (
                        <p key={index} className={index > 0 ? 'mt-2' : ''}>
                          {line}
                        </p>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </div>


      </div>
    </section>
  )
}