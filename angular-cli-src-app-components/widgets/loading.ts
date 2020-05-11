import {Injectable} from '@angular/core';

@Injectable()
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class Loading {

    private loading: number = 0;
    private context: string|undefined;
    private loadingStart: Date|undefined = undefined;


    public start(context?: string) {

        if (this.loading === 0) this.loadingStart = new Date();

        if (context && !this.context) this.context = context;
        this.loading++;
    }


    public stop() {

        this.loading--;
        if (this.loading === 0) {
            this.context = undefined;
            this.loadingStart = undefined;
        }
    }


    public isLoading(context?: string): boolean {

        return this.loading > 0 && (!context || context === this.context);
    }


    public getContext(): string|undefined {

        return this.context;
    }


    public getLoadingTimeInMilliseconds(): number {

        if (!this.loadingStart) return -1;

        return new Date().getTime() - this.loadingStart.getTime();
    }
}