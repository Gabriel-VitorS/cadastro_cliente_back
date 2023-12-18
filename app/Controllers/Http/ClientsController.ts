import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import {schema, rules} from '@ioc:Adonis/Core/Validator'
import Database from '@ioc:Adonis/Lucid/Database'
import Client from 'App/Models/Client'

export default class ClientsController {

    private validateRequest = schema.create({
        'nome': schema.string([
            rules.maxLength(50),
            rules.minLength(1)
        ]),
        'email': schema.string.nullableAndOptional([
            rules.email(),
            rules.maxLength(50),
        ]),
        'telefone': schema.string.nullableAndOptional([
            rules.maxLength(11),
            rules.minLength(11),
            rules.regex(/^[0-9]*$/)
        ]),
        'cpf': schema.string([
            rules.maxLength(11),
            rules.minLength(11),
            rules.regex(/^[0-9]*$/)
        ]),
    })

    private messageValidate = {
        messages: {
            required: "O campo '{{ field }}' é obrigatório",
            'email.maxLength': "O campo 'email' não pode ultrapassar 50 caracteres",
            'email.email': "O campo 'email' precisa ser um válido",
            'cpf.minLength': "O campo 'cpf' tem que ter 11 caracteres e somente número",
            'cpf.maxLength': "O campo 'cpf' tem que ter 11 caracteres e somente número",
            'cpf.regex': "O campo 'cpf' tem que ter 11 caracteres e somente número",
            'telefone.minLength': "O campo 'cpf' tem que ter 11 caracteres e somente número",
            'telefone.maxLength': "O campo 'cpf' tem que ter 11 caracteres e somente número",
            'telefone.regex': "O campo 'cpf' tem que ter 11 caracteres e somente número",
        }
    }

    public async verifyCPFIfExist( cpf:string, idClient = 0 ): Promise<boolean>{
        
        const findCPF = await Database.from('clients').where('cpf', 'like', `%${cpf}%`).first()

        if(idClient == 0){        
            if(findCPF)
                return true
            else
                return false
        }else{

            if(findCPF && idClient == findCPF.id)
                return false
            else if(findCPF && idClient != findCPF.id)
                return true
            else
                return false
        }
    }

    public async show({params,response}:HttpContextContract){

        try {

            return await Client.find(params.id)
            
        } catch (error) {
            response.status(500)
            return {
                message: 'Server error',
                error: error
            }
        }

    }

    public async store({request,response}:HttpContextContract){

        const body = request.all()

        const messages = this.messageValidate.messages

        await request.validate({schema: this.validateRequest, messages})

        if(await this.verifyCPFIfExist(body.cpf)){
            response.status(422)
            return {
                errors:{
                    message: 'CPF já cadastrado'
                }
            }
        }

        try {

            const client = await Client.create(body);

            return client.id
            
        } catch (error) {
            response.status(500)
            return {
                message: 'Server error',
                error: error
            }
        }

    }

    public async index({request,response}:HttpContextContract){

        const body = request.all()

        try {

            const clients = await Database.from('clients')
            .andWhere((query)=>{

                if(body.nome)
                    query.from('clients').where('nome', 'like',`%${body.nome}%`)

                if(body.telefone)
                    query.from('clients').where('telefone', 'like',`%${body.telefone}%`)

                if(body.email)
                    query.from('clients').where('email', 'like',`%${body.email}%`)

                if(body.cpf)
                    query.from('clients').where('cpf', 'like',`%${body.cpf}%`)
                    
            })
            .orderBy('created_at', 'desc')
            .paginate(body.pagina ?? 1, body.limite ?? 15);

            return clients
            
        } catch (error) {
            response.status(500)
            return {
                message: 'Server error',
                error: error
            }
        }

    }

    public async update({request, params,response}:HttpContextContract){

        const body = request.all()

        const messages = this.messageValidate.messages

        await request.validate({schema: this.validateRequest, messages})

        if(await this.verifyCPFIfExist(body.cpf, params.id)){
            response.status(422)
            return {
                errors:{
                    message: 'CPF já cadastrado'
                }
            }
        }

        try {

            const client = await Client.findOrFail(params.id)

            client.nome = body.nome
            client.cpf = body.cpf
            client.telefone = body.telefone ?? client.telefone
            client.email = body.email ?? client.telefone

            client.save()

            return client.id

            
        } catch (error) {
            response.status(500)
            return {
                message: 'Server error',
                error: error
            }
        }

    }

    public async destroy({params,response}:HttpContextContract){

        try {

            return (await Client.findOrFail(params.id)).delete()
            
        } catch (error) {
            response.status(500)
            return {
                message: 'Server error',
                error: error
            }
        }

    }
}
