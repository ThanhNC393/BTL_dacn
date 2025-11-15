

def deco2(func):
    def handle_func(*args, **kwargs):
        return func(*args, **kwargs)
    return handle_func


def deco(func):
    def handle_func(*args, **Kwargs):

        return func(*args, **Kwargs)

    return handle_func
    

@deco2
@deco
def check(a):
    print(a)



check(3)