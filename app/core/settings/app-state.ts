import {Injectable} from '@angular/core';

@Injectable()
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class AppState {

    private currentUser: string;
    private imagestorePath: string;
    private model3DStorePath: string;


    public getCurrentUser(): string {

        return this.currentUser;
    }


    public setCurrentUser(name: string) {

        this.currentUser = name;
    }


    public getImagestorePath(): string {

        return this.imagestorePath;
    }


    public setImagestorePath(imagestorePath: string) {

        this.imagestorePath = imagestorePath;
    }


    public getModel3DStorePath(): string {

        return this.model3DStorePath;
    }


    public setModel3DStorePath(model3DStorePath: string) {

        this.model3DStorePath = model3DStorePath;
    }
}