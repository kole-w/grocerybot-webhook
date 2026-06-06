const express = require('express')
const { createClient } = require('@supabase/supabase-js')

const app = express()
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

app.post('/sms', async (req, res) => {
  const body = req.body.Body || ''
  const text = body.trim().toLowerCase()

  // Parse store from message e.g. "eggs, milk from HyVee"
  let store = null
  let itemsText = text

  const fromMatch = text.match(/from\s+(.+)$/i)
  if (fromMatch) {
    store = fromMatch[1].trim()
    itemsText = text.replace(/from\s+.+$/i, '').trim()
  }

  // Split items by comma
  const items = itemsText.split(',').map(i => i.trim()).filter(Boolean)

  // Insert each item into Supabase
  for (const item of items) {
    await supabase.from('grocery_items').insert({
      name: item,
      store: store,
      is_classified: store ? true : false,
      added_by: 'sms'
    })
  }

  // Respond to Twilio
  res.set('Content-Type', 'text/xml')
  res.send(`<Response><Message>Added ${items.length} item(s) to Grocery Bot! 🤖</Message></Response>`)
})

app.get('/', (req, res) => res.send('Grocery Bot Webhook Running!'))

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
