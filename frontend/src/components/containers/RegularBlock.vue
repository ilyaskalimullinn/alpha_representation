<template>
    <div class="block">
        <slot> </slot>
    </div>
</template>

<script>
export default {
    name: "RegularBlock",
};
</script>

<style scoped>
.block {
    border: 1px solid black;
    border-radius: 5px;
    margin: 10px 0;
    padding: 10px;
}
</style>
