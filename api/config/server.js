import dotenv from 'dotenv'
import serve from 'koa-static'
import Koa from 'koa'
import Logger from 'koa-logger'
import Cors from '@koa/cors'
import BodyParser from 'koa-bodyparser'
import respond from 'koa-respond'
import mount from 'koa-mount'
import routes from '../routes'
import getToken from '../middleware/jwt-middleware'
import jwt from 'koa-jwt'
import graphqlHttp from 'koa-graphql'
import graphqlSchema from '../graphql/schema'
import graphqlResolver from '../graphql/resolvers'

dotenv.config()

const app = new Koa()

app.use(mount('/graphql', graphqlHttp((ctx) => ({
  schema: graphqlSchema,
  rootValue: graphqlResolver,
  graphiql: true,
  context: ctx,
  formatError (err) {
    if (!err.originalError) {
      return err
    }
    const data = err.originalError.data
    const message = err.message || 'The API did something wrong'
    const status = err.originalError.status || 500

    return {
      message,
      data,
      status
    }
  }
}))))

app.use(mount('/public', serve('./public')))

app.use(Logger())

app.use(
  Cors({
    origin: '*',
    allowMethods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE', 'PATCH'],
    exposeHeaders: ['X-Request-Id']
  })
)
app.use(BodyParser({
  enableTypes: ['json']
}))

app.use(jwt({
  secret: process.env.SECRET,
  getToken
}).unless({
  path: [
    '/v1/users/login',
    '/v1/users/signup',
    '/public'
  ]
}))

app.use(respond())

app.use(routes.routes())

app.use(routes.allowedMethods())

export default app
