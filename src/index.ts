import express, { Express, Request, Response } from 'express';
import * as crypto from 'crypto';

const app: Express = express();

app.use(express.json());
const webhook_secret: string = "Esmuysecreto";

const verifiySignature = (req: Request) => {
    const signature = crypto
        .createHmac('sha1', webhook_secret)
        .update(JSON.stringify(req.body))
        .digest('hex');
    let trusted = Buffer.from(`sha1=${signature}`, 'ascii');
    let untrusted = Buffer.from(req.headers['x-hub-signature'] as string, 'ascii');
    return crypto.timingSafeEqual(trusted, untrusted);
}

const verifyKeyMiddleware = (req: Request, res: Response, next: any) => {
    try {
        verifiySignature(req);
        next();
    }   catch (error) {
        res.status(401).send('Unauthorized');
    }

}



app.post('/api/github-event', verifyKeyMiddleware, (req: Request, res: Response) => {
    const { body } = req;
    const { action, sender, repository } = body;
    const event = req.header('x-github-event');
    let message = '';

    switch (event) {
        case 'star':
            message = `${sender.login} ${action} star on ${repository.full_name}`;
            break;
        case 'issues':
            const { issue } = body;
            message =` ${sender.login} ${action} issue ${issue.title} on ${repository.full_name}`;
            break;
        case 'push':
            message = `${sender.login} pushes on ${repository.full_name}`;
            break;
        default:
            message =` Evento desconocido: ${event}`;
            break;
    }
    console.log(message);

    fetch('https://discord.com/api/webhooks/1205600962081980496/f5TVLqvpKuIUEqLTIPUWXESLgeG9a_nxBJyRhFY7OhnxTT3ECRvYQ0aq1kbbTY1PXxs9', {
        method: 'POST',
        body: JSON.stringify({ content: message }),
        headers: { 'Content-Type': 'application/json' },
    }
    )



    res.status(200).json({ success: true });
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});