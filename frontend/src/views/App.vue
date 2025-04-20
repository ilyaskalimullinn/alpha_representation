<template>
    <h1>Tait coloring 2</h1>

    <button :onclick="doSomething">Fetch</button>
</template>

<script>
export default {
    data() {
        return {};
    },
    methods: {
        doSomething: async () => {
            let matrix = [
                [
                    [0, 1, 3, 5],
                    [0, 1],
                    [0, 5],
                    [1, 3],
                    [3, 5],
                ],
                [[0, 1], [0, 1, 2], [0, 2], [1, 2], []],
                [
                    [0, 5],
                    [0, 2],
                    [0, 2, 4, 5],
                    [2, 4],
                    [4, 5],
                ],
                [
                    [1, 3],
                    [1, 2],
                    [2, 4],
                    [1, 2, 3, 4],
                    [3, 4],
                ],
                [[3, 5], [], [4, 5], [3, 4], [3, 4, 5]],
            ];
            let resp = await fetch("/api/v1/calc_tait_0", {
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                method: "POST",
                body: JSON.stringify({
                    faces_matrix: matrix,
                }),
            });
            let respBody = await resp.json();
            console.log(respBody);
        },
    },
};
</script>
