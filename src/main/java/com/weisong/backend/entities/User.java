package com.weisong.backend.entities;
import com.weisong.backend.util.UuidBuilder;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.Column;
import javax.persistence.Table;
import javax.validation.constraints.*;
import java.util.Date;

/**
 * @author 李伟松
 * @create 2022-02-16-19:36
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name ="user")
public class User {

    @Column(name="uuid")
    private String uuid;

    private String avatar;

    @NotEmpty(message = "名字不能为空")
    @Column(name="name")
    private String name;

    @NotEmpty(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    @Column(name="email")
    private String email;

    @NotNull(message = "性别不能为空")
    @Column(name="gender")
    private Integer gender;

    @Past(message = "只能用过去的时间")
    @Column(name="birth")
    private Date birth;

    public String getUuid() {
        return UuidBuilder.createUUID();
    }

    public void setUuid(String uuid) {
        this.uuid = uuid;
    }
}
