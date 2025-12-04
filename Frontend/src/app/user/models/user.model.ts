export class User {
    firstname: string = "";
    lastname: string = "";
    email: string = "";
    password: string;
    country: string = "";
    city:string = "";
    address: string = "";
    type: string;
    workAt: string = "";
    class:string;
    linkedin: string = "";
    picture:string ;
    phone:string  = "";
    aboutme:string = "";
    promotion:string;
    constructor(type : string){
        this.type = type;
        
    }
}