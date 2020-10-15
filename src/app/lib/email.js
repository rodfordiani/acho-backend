const fs = require('fs')
const handlebars = require('handlebars')
const { mailgunConfig } = require('../../config/config.json')
const { emailSubject } = require('../../config/enum.json')
const mailgun = require('mailgun-js')(mailgunConfig)

/**
 * Send email
 * @param {string} subjectType Subject type
 * @param {object} data Email's data according to type:
 *                      Type solicit object: { name, devolutionCode }
 *                      Type pass recovery: { name, url }
 */
module.exports = (subjectType, data) => {
  let template = {}

  switch (subjectType) {
    case emailSubject.SOLICIT_OBJECT:
      template.path = './src/template/solicit-object.html'
      template.subject = 'Solicitação de devolução de objeto'
      template.variable = data
      break
    case emailSubject.PASS_RECOVERY:
      template.path = './src/template/pass-recovery.html'
      template.subject = 'Recuperação de Senha'
      template.variable = data
  }

  fs.readFile(template.path, 'utf8', (_error, file) => {
    const html = handlebars.compile(file)

    const emailInfo = {
      from: '<Acho@samples.mailgun.org>',
      to: 'projetointegrado509@gmail.com',
      subject: template.subject,
      html: html(template.variable)
    }

    mailgun.messages().send(emailInfo)
  })
}
